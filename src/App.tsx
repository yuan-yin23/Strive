import './App.css'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Personal from './pages/Personal'
import Leaderboards from './pages/Leaderboards'
import SubmitStats from './pages/SubmitStats'
import NotFound from './pages/NotFound'
import Register from './pages/Register'
import Login from './pages/Login'

function App() {
  return (
    <div className="app-root">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/me" element={<Personal />} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          <Route path="/submit" element={<SubmitStats />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
