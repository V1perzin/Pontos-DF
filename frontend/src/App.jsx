import React, { useState, useEffect } from 'react'
import MapView from './components/MapView'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import CreatePoint from './components/CreatePoint'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function App(){
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')||'null'));
  const [page, setPage] = useState('map');

  useEffect(()=>{
    if(token) localStorage.setItem('token', token); else localStorage.removeItem('token');
    if(user) localStorage.setItem('user', JSON.stringify(user)); else localStorage.removeItem('user');
  },[token,user]);

  return (
    <div>
      <header className="header">
        <div className="logo">PontosDF</div>
        <div>
          {user ? (
            <>
              <span style={{marginRight:10}}>Olá, {user.name||user.email}</span>
              <button className="btn" onClick={()=>{ setPage('create') }}>Enviar Ponto</button>
              <button className="btn" style={{marginLeft:8,background:'#666'}} onClick={()=>{ setUser(null); setToken(null); setPage('map') }}>Sair</button>
            </>
          ):(
            <>
              <button className="btn" onClick={()=>setPage('login')}>Entrar</button>
              <button className="btn" style={{marginLeft:8}} onClick={()=>setPage('register')}>Registrar</button>
            </>
          )}
        </div>
      </header>

      <div className="container">
        <aside className="sidebar">
          <div className="card">
            <h3>Pesquisar pontos</h3>
            <SearchBox setPage={setPage}/>
          </div>
          <div className="card small">
            <strong>OBS:</strong> Conta admin inicial: admin@example.com / admin123
          </div>
        </aside>

        <main className="mapwrap">
          {page === 'map' && <MapView token={token} />}
          {page === 'login' && <LoginForm onLogin={(u,t)=>{ setUser(u); setToken(t); setPage('map'); }} apiUrl={API} />}
          {page === 'register' && <RegisterForm onRegister={(u,t)=>{ setUser(u); setToken(t); setPage('map'); }} apiUrl={API} />}
          {page === 'create' && <CreatePoint token={token} apiUrl={API} onDone={()=>setPage('map')} />}
        </main>
      </div>
    </div>
  )
}

function SearchBox({setPage}){
  const [q,setQ] = useState('');
  return (
    <div>
      <input className="input" placeholder="Pesquisar por nome ou descrição" value={q} onChange={e=>setQ(e.target.value)} />
      <div style={{marginTop:8}}>
        <button className="btn" onClick={()=>setPage('map')}>Buscar</button>
      </div>
    </div>
  )
}

export default App