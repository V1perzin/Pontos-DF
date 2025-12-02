import React, {useState} from 'react'
import axios from 'axios'

export default function Login(){
  const [form, setForm] = useState({email:'',password:''});
  const [msg, setMsg] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try{
      const r = await axios.post('http://localhost:4000/api/login', form);
      const token = r.data.token;
      localStorage.setItem('token', token);
      setMsg('Logado. Token salvo no localStorage.');
    }catch(e){ setMsg(e.response?.data?.error || 'Erro'); }
  }
  return (<div className="container">
    <h2>Login</h2>
    <div className="card">
      <form onSubmit={submit}>
        <label>E-mail</label>
        <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
        <label>Senha</label>
        <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
        <button type="submit">Login</button>
      </form>
      <p>{msg}</p>
    </div>
  </div>)
}