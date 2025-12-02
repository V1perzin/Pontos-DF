import React, {useState} from 'react'
import axios from 'axios'

export default function Register(){
  const [form, setForm] = useState({name:'',email:'',password:''});
  const [msg, setMsg] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try{
      const r = await axios.post('http://localhost:4000/api/register', form);
      setMsg(r.data.message || 'OK. Veja console do servidor para token.');
    }catch(e){ setMsg(e.response?.data?.error || 'Erro'); }
  }
  return (<div className="container">
    <h2>Registrar</h2>
    <div className="card">
      <form onSubmit={submit}>
        <label>Nome</label>
        <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
        <label>E-mail</label>
        <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
        <label>Senha</label>
        <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
        <button type="submit">Registrar</button>
      </form>
      <p>{msg}</p>
    </div>
  </div>)
}