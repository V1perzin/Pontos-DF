import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function MapView(){
  const [points, setPoints] = useState([]);

  useEffect(()=>{
    fetch(API + '/api/points')
      .then(r=>r.json())
      .then(setPoints)
      .catch(console.error);
  },[]);

  return (
    <MapContainer center={[-15.7801, -47.9292]} zoom={12} style={{height:'100%', minHeight:'600px'}}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {points.map(p=>(
        <Marker key={p.id} position={[p.latitude||-15.78, p.longitude||-47.93]}>
          <Popup>
            <div style={{minWidth:200}}>
              <strong>{p.name}</strong>
              <div className="small">{p.category_label}</div>
              {p.image_url && <img src={'http://localhost:4000'+p.image_url} style={{width:'100%', marginTop:6}} />}
              <p style={{marginTop:6}}>{p.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}