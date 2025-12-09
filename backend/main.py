from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import connect_to_mongo, close_mongo_connection
from config import settings
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime
from pymongo import AsyncMongoClient
from dotenv import load_dotenv
import os
from pydantic.functional_validators import BeforeValidator
from bson import ObjectId

from typing_extensions import Annotated

PyObjectId = Annotated[str, BeforeValidator(str)]

# Lifespan context manager for startup/shutdown events (async)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await connect_to_mongo()
    try:
        yield
    finally:
        await close_mongo_connection()

load_dotenv()
MONGO_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")
app = FastAPI(
    title="Strive API",
    description="Backend API for Strive",
    version="0.1.0",
    lifespan=lifespan,
)
client = AsyncMongoClient(MONGO_URL)

db = client[DATABASE_NAME]
stats_collection = db.get_collection("stats")
users_collection = db.get_collection("users")
workouts_collection = db.get_collection("workouts")

def serialize_doc(doc: dict):
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

# Enable CORS for frontend communication
origins = [
    "http://localhost:5173",  # Vite default port
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Exercise(BaseModel):
    id: str
    bodyPart: str
    exercise: str
    sets: int
    reps: int
    weight: float

class StatsSubmission(BaseModel):
    sessionTime: int
    exercises: List[Exercise]
    totalWeight: float
    timestamp: str
    userId: str  # Added userId to link workout to user

class User(BaseModel):
    id: PyObjectId | None = Field(alias="_id", default=None)
    email: EmailStr = Field(...)
    username: str = Field(...)
    name: str = Field(...)
    workouts: List[Exercise] = Field(default_factory=list)
    maxBench: int = 0
    maxSquat: int = 0
    maxDeadlift: int = 0

class RegisterUser(BaseModel):
    email: EmailStr = Field(...)
    username: str = Field(...)
    name: str = Field(...)

class LoginRequest(BaseModel):
    name: str
    email: EmailStr

class UserCollection(BaseModel):
    users: List[User]

@app.get("/leaderboard")
async def leaderboard():
    users = await users_collection.find().to_list(None)

    # Convert ObjectId
    for u in users:
        u["_id"] = str(u["_id"])

    # Overview leaderboard example
    overview = [
        {
            "title": "Total Weight Lifted",
            "data": sorted(
                [
                    {
                        "name": u["name"],
                        "rank": 0,   # filled after sorting
                        "value": u.get("totalWeight", 0)
                    }
                    for u in users
                ],
                key=lambda x: x["value"],
                reverse=True
            )
        }
    ]

    # Assign rank numbers
    for section in overview:
        for i, entry in enumerate(section["data"]):
            entry["rank"] = i + 1

    # Max lift board
    max_board = [
        {
            "title": "Bench Press (Max)",
            "data": sorted(
                [
                    {"name": u["name"], "rank": 0, "value": u.get("maxBench", 0)}
                    for u in users
                ],
                key=lambda x: x["value"],
                reverse=True
            )
        }
    ]

    for section in max_board:
        for i, entry in enumerate(section["data"]):
            entry["rank"] = i + 1

    return {
        "overview": overview,
        "max": max_board,
    }

@app.get("/workouts/{user_id}")
async def get_user_workouts(user_id: str):
    """Retrieve all workouts for a specific user by user ID."""

    try:
        obj_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    # Ensure the user exists
    user = await users_collection.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch all workout sessions linked to this user
    workouts_cursor = workouts_collection.find({"userId": user_id}).sort("timestamp", -1)

    workouts = []
    async for w in workouts_cursor:
        workouts.append(serialize_doc(w))

    return {
        "userId": user_id,
        "count": len(workouts),
        "workouts": workouts
    }
    

@app.post("/login")
async def login(request: LoginRequest):
    user = await users_collection.find_one({
        "email": request.email,
        "name": request.name
    })

    if not user:
        return {"error": "User not found. Check your name and email."}

    user["_id"] = str(user["_id"])

    return {
        "message": "Login successful!",
        "user": user
    }

@app.post("/register")
async def register(user: RegisterUser):
    new_user = user.model_dump(by_alias=True, exclude=["id"])
    result = await users_collection.insert_one(new_user)
    new_user["_id"] = result.inserted_id
    return serialize_doc(new_user)

@app.post("/stats")
async def submit_stats(data: StatsSubmission):
    """Submit a workout session and update user stats."""
    
    # Convert userId into ObjectId
    try:
        user_obj_id = ObjectId(data.userId)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    # Fetch user
    user = await users_collection.find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # --- 1. SAVE WORKOUT SESSION ---
    submission = data.model_dump()
    submission["created_at"] = datetime.now()
    await workouts_collection.insert_one(submission)

    # --- 2. CALCULATE TOTAL WEIGHT AND MAXES FROM THIS WORKOUT ---
    total_weight = 0
    new_max_bench = user.get("maxBench", 0)
    new_max_squat = user.get("maxSquat", 0)
    new_max_deadlift = user.get("maxDeadlift", 0)

    for ex in data.exercises:
        lifted = ex.weight * ex.reps * ex.sets
        total_weight += lifted

        # Update max lifts
        if ex.exercise.lower() == "bench press" and ex.weight > new_max_bench:
            new_max_bench = ex.weight

        if ex.exercise.lower() == "squat" and ex.weight > new_max_squat:
            new_max_squat = ex.weight

        if ex.exercise.lower() == "deadlift" and ex.weight > new_max_deadlift:
            new_max_deadlift = ex.weight

    # --- 3. UPDATE USER STATS IN DB ---
    await users_collection.update_one(
        {"_id": user_obj_id},
        {
            "$set": {
                "maxBench": new_max_bench,
                "maxSquat": new_max_squat,
                "maxDeadlift": new_max_deadlift
            },
            "$inc": {
                "totalWeight": total_weight  # Create this field if it doesn't exist
            }
        }
    )

    return {"message": "Workout saved and stats updated!"}

@app.get("/workouts/{user_id}")
async def get_user_workouts(user_id: str):
    """Get all workouts for a specific user"""
    try:
        # Validate user_id
        obj_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    # Verify user exists
    user = await users_collection.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Fetch all workouts for this user
    workouts = []
    cursor = workouts_collection.find({"userId": user_id}).sort("timestamp", -1)
    async for workout in cursor:
        workouts.append(serialize_doc(workout))
    
    return {
        "user_id": user_id,
        "workouts": workouts
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to Strive API"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)