import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Register from './pages/Register'
import Login from './pages/Login'
import Submit from './pages/Submit'
import MapPage from './pages/MapPage'
import Admin from './pages/Admin'
import './styles.css'

function App(){
  return (
    <BrowserRouter>
      <nav className="nav">
        <Link to="/">Mapa</Link>
        <Link to="/submit">Enviar Ponto</Link>
        <Link to="/register">Registrar</Link>
        <Link to="/login">Login</Link>
        <Link to="/admin">Admin</Link>
      </nav>
      <Routes>
        <Route path="/" element={<MapPage/>} />
        <Route path="/submit" element={<Submit/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/admin" element={<Admin/>} />
      </Routes>
    </BrowserRouter>
  )
}

createRoot(document.getElementById('root')).render(<App />)