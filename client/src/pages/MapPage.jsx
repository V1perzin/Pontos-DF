import React, {useEffect, useRef} from 'react'
import axios from 'axios'
import * as Cesium from 'cesium'

export default function MapPage(){
  const ref = useRef();
  useEffect(()=>{
    // Simple Cesium viewer setup (must install cesium and set up static assets for production)
    const viewer = new Cesium.Viewer(ref.current, {
      timeline: false,
      animation: false,
      baseLayerPicker: true
    });
    // fetch approved points
    axios.get('http://localhost:4000/api/points').then(r=>{
      const pts = r.data || [];
      pts.forEach(p=>{
        if (p.latitude && p.longitude){
          viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(p.longitude, p.latitude),
            point: { pixelSize: 10 },
            label: { text: p.name || 'Ponto', showBackground: true }
          });
        } else if (p.geojson){
          // try to parse geojson feature
          try {
            const f = JSON.parse(p.geojson);
            // For prototype, add label at coords if Point
            if (f.geometry && f.geometry.type === 'Point'){
              const [lon,lat] = f.geometry.coordinates;
              viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(lon, lat),
                point: { pixelSize: 8 },
                label: { text: f.properties?.name || 'GeoJSON', showBackground: true }
              });
            }
          }catch(e){}
        }
      });
    }).catch(()=>{});
    return ()=> viewer && viewer.destroy();
  },[]);
  return (<div style={{height:'80vh'}} ref={el=>ref.current=el}></div>);
}