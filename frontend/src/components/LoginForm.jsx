import React, { useState } from 'react'

export default function LoginForm({ onLogin, apiUrl }){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [err,setErr]=useState(null);
  const submit = async () => {
    setErr(null);
    try{
      const res = await fetch((apiUrl||'http://localhost:4000') + '/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
      const data = await res.json();
      if(res.ok){
        onLogin(data.user, data.token);
      } else {
        setErr(data.error || 'Erro');
      }
    }catch(e){ setErr('Erro de conexão') }
  }
  return (
    <div style={{padding:20}}>
      <h3>Entrar</h3>
      <div className="form-row"><label>Email</label><input className="input" value={email} onChange={e=>setEmail(e.target.value)} /></div>
      <div className="form-row"><label>Senha</label><input type="password" className="input" value={password} onChange={e=>setPassword(e.target.value)} /></div>
      {err && <div style={{color:'red'}}>{err}</div>}
      <div style={{marginTop:10}}><button className="btn" onClick={submit}>Entrar</button></div>
    </div>
  )
}