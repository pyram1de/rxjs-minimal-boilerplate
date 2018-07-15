import { Observable } from "rxjs";
import L from 'leaflet';
import { loadJSONP } from './jsonp';
import { appendToTag, addCss, addRawHtml, makeRow } from './HTMLhelpers';

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

function initialize(){
  const quake$ = Observable.timer(100,5000)
    .flatMap(()=>{
      return loadJSONP({
        url: QUAKE_URL,
        callbackName: "eqfeed_callback"
      }).retry(3);
    })
    .flatMap(result => Observable.from(result.response.features))
    .distinct(quake=> quake.properties.code).share();

const codeLayers = {};
const quakeLayer = L.layerGroup([]).addTo(map);

  quake$.subscribe(quake=>{
    const coords = quake.geometry.coordinates;
    const size = quake.properties.mag * 10000;
    const circle = L.circle([coords[1],coords[0]], size).addTo(map);

    L.circle([coords[1],coords[0]], size).addTo(map);
    quakeLayer.addLayer(circle);
    codeLayers[quake.id] = quakeLayer.getLayerId(circle);
  });

const identity = x => x;

function isHovering(element){
  const over = Observable.fromEvent(element, "mouseover").map(x=>{
    return true;
  });
  const out = Observable.fromEvent(element, "mouseout").map(x=>{
    return false;
  });
  return over.merge(out);
}
  
  const table = document.getElementById("quakes_info");

  function getRowFromEvent(event) {
    return Observable
      .fromEvent(table, event)
      .filter(({target})=> {
        return target.tagName ==="TD" && target.parentNode.id.length;
      })
      .pluck("target", "parentNode")
      .distinctUntilChanged();
  }

  getRowFromEvent("mouseover").pairwise().subscribe(rows=>{
    const prevCircle = quakeLayer.getLayer(codeLayers[rows[0].id]);
    const currCircle = quakeLayer.getLayer(codeLayers[rows[1].id]);
    prevCircle.setStyle({color: '#0000ff'});
    currCircle.setStyle({color:'#ff0000'});
  });

  getRowFromEvent("click").subscribe(row=>{
    const circle = quakeLayer.getLayer(codeLayers[row.id]);
    map.panTo(circle.getLatLng());
  });

  quake$.pluck("properties")
  .map(function(props){
    return makeRow(props);
  })
  .bufferTime(500)
  .filter(rows=>rows.length>0)
  .map(rows=>{
    const fragment = document.createDocumentFragment();
    rows.forEach(row=>{
      fragment.appendChild(row);
    });
    return fragment;
  }) .subscribe(fragment=>{
    table.appendChild(fragment);
  });
}





Observable.fromEvent(document,'DOMContentLoaded').subscribe(x=>{
  initialize();
});


