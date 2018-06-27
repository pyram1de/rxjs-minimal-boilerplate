import { Observable } from "rxjs";
import L from 'leaflet';

const QUAKE_URL = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp'

function loadJSONP(url){
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = url;

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://unpkg.com/leaflet@1.3.1/dist/leaflet.css";
  css.crossOrigin = "";
  css.type = "text/css";

  const head = document.getElementsByTagName("head")[0];
  if(head){
    head.appendChild(css);
    head.appendChild(script);
    
  }
}

const mapcontainer = document.createElement("div");
mapcontainer.id = "map";
mapcontainer.style.height = "680px";
mapcontainer.style.width = "680px";
mapcontainer.style.border = "1px solid black"
document.body.appendChild(mapcontainer);


var map = L.map('map').setView([33.858631, -118.279602], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

const quake$ = Observable.create(observer=>{
  window.eqfeed_callback = response => { 
    response.features.forEach(x=>observer.next(x)); 
  }

  loadJSONP(QUAKE_URL);
})

quake$.subscribe(quake=>{
  console.log('QUAKE', quake);
  const coords = quake.geometry.coordinates;
  const size = quake.properties.mag * 10000;
 
  L.circle([coords[1],coords[0]], size).addTo(map);
})
