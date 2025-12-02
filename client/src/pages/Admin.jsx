import React, {useState, useEffect} from 'react'
import axios from 'axios'

export default function Admin(){
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState('');
  const token = localStorage.getItem('token');
  useEffect(()=>{ fetchPage(); }, []);
  const fetchPage = async () => {
    try{
      const r = await axios.get('http://localhost:4000/api/admin/points', { headers: { Authorization: 'Bearer '+token }});
      setItems(r.data);
    }catch(e){ setMsg(e.response?.data?.error || 'Erro'); }
  }
  const approve = async (id) => {
    await axios.post(`http://localhost:4000/api/admin/points/${id}/approve`, {}, { headers: { Authorization: 'Bearer '+token }});
    fetchPage();
  }
  const reject = async (id) => {
    await axios.post(`http://localhost:4000/api/admin/points/${id}/reject`, {}, { headers: { Authorization: 'Bearer '+token }});
    fetchPage();
  }
  return (<div className="container">
    <h2>Painel Admin - Pontos Pendentes</h2>
    <div>{msg}</div>
    {items.length===0 && <div className="card">Nenhum ponto pendente.</div>}
    {items.map(p=>(
      <div key={p.id} className="card">
        <strong>{p.name}</strong>
        <div>Coords: {p.latitude},{p.longitude}</div>
        <div>{p.description}</div>
        <button onClick={()=>approve(p.id)}>Aprovar</button>
        <button onClick={()=>reject(p.id)} style={{marginLeft:8}}>Rejeitar</button>
      </div>
    ))}
  </div>)
}