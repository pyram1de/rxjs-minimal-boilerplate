import { Observable } from "rxjs";
import L from 'leaflet';
import { loadJSONP } from './jsonp';
import { appendToTag, addCss, addRawHtml } from './HTMLhelpers';

const QUAKE_URL = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojsonp'

function Map(){
  
  addCss("https://unpkg.com/leaflet@1.3.1/dist/leaflet.css");
  const mapcontainer = document.createElement("div");
  mapcontainer.id = "map";
  mapcontainer.style.height = "680px";
  mapcontainer.style.width = "680px";
  mapcontainer.style.border = "1px solid black"
  appendToTag("body",mapcontainer);  
  addRawHtml("body",
  `<table>
  <thead>
      <tr>
          <th>Location</th>
          <th>Magnitude</th>
          <th>Time</th>
      </tr>       
  </thead>
  <tbody id="quakes_info"></tbody>
  </table>`)
  var map = L.map('map').setView([33.858631, -118.279602], 7);
  
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
  return map;
}

var map = new Map();
/*

*/

function initialize(){
  const quake$ = Observable.timer(100,5000)
    .flatMap(()=>{
      return loadJSONP({
        url: QUAKE_URL,
        callbackName: "eqfeed_callback"
      }).retry(3);
    })
    .flatMap(result => Observable.from(result.response.features))
    .distinct(quake=> quake.properties.code);

  quake$.subscribe(quake=>{
    console.log('tick');
    const coords = quake.geometry.coordinates;
    const size = quake.properties.mag * 10000;
  
    L.circle([coords[1],coords[0]], size).addTo(map);
  });
}

Observable.fromEvent(document,'DOMContentLoaded').subscribe(x=>{
  console.log('dom document loaded');
  initialize()
});
