import React, { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function CreatePoint({ token, apiUrl, onDone }){
  const base = apiUrl || API;
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState({ name:'', category_id:'', address:'', description:'', latitude:'', longitude:'' });
  const [image, setImage] = useState(null);
  const [msg,setMsg] = useState(null);

  useEffect(()=>{
    fetch(base + '/api/categories').then(r=>r.json()).then(setCats).catch(console.error);
  },[]);

  const handleGeocode = async () => {
    if(!form.address) { setMsg('Preencha o endereço'); return; }
    // Use Nominatim public geocoding
    try{
      const res = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(form.address) + '&limit=1');
      const js = await res.json();
      if(js && js[0]){
        setForm({...form, latitude: js[0].lat, longitude: js[0].lon});
        setMsg('Geocoding OK');
      } else setMsg('Endereço não encontrado');
    }catch(e){ setMsg('Erro no geocoding') }
  }

  const submit = async () => {
    if(!token){ setMsg('Você precisa entrar para enviar'); return; }
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('category_id', form.category_id);
    fd.append('address', form.address);
    fd.append('description', form.description);
    if(form.latitude) fd.append('latitude', form.latitude);
    if(form.longitude) fd.append('longitude', form.longitude);
    if(image) fd.append('image', image);
    try{
      const res = await fetch(base + '/api/points', { method:'POST', headers:{ Authorization: 'Bearer ' + token }, body: fd });
      const js = await res.json();
      if(res.ok){ setMsg('Ponto enviado e está pendente de validação.'); setForm({ name:'', category_id:'', address:'', description:'', latitude:'', longitude:''}); setImage(null); if(onDone) onDone(); }
      else setMsg(js.error || 'Erro');
    }catch(e){ setMsg('Erro de conexão') }
  }

  return (
    <div style={{padding:20}}>
      <h3>Enviar Ponto</h3>
      <div className="form-row"><label>Nome</label><input className="input" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} /></div>
      <div className="form-row"><label>Categoria</label>
        <select className="input" value={form.category_id} onChange={e=>setForm({...form, category_id: e.target.value})}>
          <option value="">-- selecione --</option>
          {cats.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <div className="form-row"><label>Endereço</label><input className="input" value={form.address} onChange={e=>setForm({...form, address: e.target.value})} /></div>
      <div style={{display:'flex', gap:8}}>
        <button className="btn" onClick={handleGeocode}>Converter endereço</button>
        <div style={{alignSelf:'center'}} className="small">{form.latitude && `Lat: ${form.latitude} Lon: ${form.longitude}`}</div>
      </div>
      <div className="form-row"><label>Descrição</label><textarea className="input" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} /></div>
      <div className="form-row"><label>Imagem (1)</label><input type="file" onChange={e=>setImage(e.target.files[0])} /></div>
      {msg && <div style={{marginTop:8}} className="small">{msg}</div>}
      <div style={{marginTop:10}}><button className="btn" onClick={submit}>Enviar</button></div>
    </div>
  )
}