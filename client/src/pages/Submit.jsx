import React, {useState} from 'react'
import axios from 'axios'

export default function Submit(){
  const [form, setForm] = useState({name:'',description:'',latitude:'',longitude:''});
  const [msg, setMsg] = useState('');
  const submitForm = async (e) => {
    e.preventDefault();
    try{
      const body = {...form};
      await axios.post('http://localhost:4000/api/points', body);
      setMsg('Ponto enviado e está pendente de aprovação.');
    }catch(e){ setMsg(e.response?.data?.error || 'Erro'); }
  }
  const uploadGeoJSON = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    await axios.post('http://localhost:4000/api/points', fd, { headers: {'Content-Type':'multipart/form-data'}});
    setMsg('GeoJSON enviado e salvo como pendente.');
  }
  return (<div className="container">
    <h2>Enviar Ponto</h2>
    <div className="card">
      <form onSubmit={submitForm}>
        <label>Nome</label>
        <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
        <label>Descrição</label>
        <input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
        <label>Latitude</label>
        <input value={form.latitude} onChange={e=>setForm({...form,latitude:e.target.value})} />
        <label>Longitude</label>
        <input value={form.longitude} onChange={e=>setForm({...form,longitude:e.target.value})} />
        <button type="submit">Enviar</button>
      </form>
      <hr />
      <label>Ou envie um arquivo GeoJSON</label>
      <input type="file" accept=".json,.geojson" onChange={uploadGeoJSON} />
      <p>{msg}</p>
    </div>
  </div>)
}