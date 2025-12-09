
import './Navbar.css'
import { useEffect, useState } from 'react'

import { Link, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const [user, setUser] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const stored = localStorage.getItem("currentUser")
    if (stored) setUser(JSON.parse(stored))
  }, [])

  return (
    <nav className="nav">
      <div className="nav-brand">Strive</div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        {user ? (
          <>
            <li><Link to="/me">My Stats</Link></li>
            <li><Link to="/submit">Submit</Link></li>
            <li><Link to="/leaderboards">Leaderboards</Link></li>
            <li>
              <Link
                to="#"
                className="nav-link-button"
                onClick={(e) => {
                  e.preventDefault()         // prevent default link behavior
                  localStorage.removeItem("currentUser")
                  setUser(null)
                  navigate("/")               // programmatically navigate
                }}
              >
                Logout
              </Link>
            </li>
          </>
        ) : (
          <>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/register">Register</Link></li>
          </>
        )}
      </ul>
    </nav>
  )
}