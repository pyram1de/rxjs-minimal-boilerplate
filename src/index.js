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

  
}

const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://unpkg.com/leaflet@1.3.1/dist/leaflet.css";
  css.crossOrigin = "";
  css.type = "text/css";

const head = document.getElementsByTagName("head")[0];
  if(head){
    head.appendChild(css);
    
  }

const mapcontainer = document.createElement("div");
mapcontainer.id = "map";
mapcontainer.style.height = "680px";
mapcontainer.style.width = "680px";
mapcontainer.style.border = "1px solid black"
document.body.appendChild(mapcontainer);


var map = L.map('map').setView([33.858631, -118.279602], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

const quake$ = Observable.interval(5000)
  .flatMap(()=>{
    return loadJSONP({
      url: QUAKE_URL,
      callbackName: "eqfeed_callback"
    }).retry(3);
  })
  .flatMap(result => Observable.from(result.response.features))
  .distinct(quake=> quake.properties.code);

quake$.subscribe(quake=>{
  console.log('QUAKE', quake);
  const coords = quake.geometry.coordinates;
  const size = quake.properties.mag * 10000;
 
  L.circle([coords[1],coords[0]], size).addTo(map);
});

function loadJSONP(settings){
  const url = settings.url;
  const callbackName = settings.callbackName;

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = url;

  window[callbackName] = data => {
    window[callbackName].data = data;
  };

  return Observable.create(observer=>{
    const handler = e => {
      const status = e.type ==="error"? 400 : 200;
      const response = window[callbackName].data;

      if(status === 200){
        observer.next({
          status,
          responseType: "jsonp",
          response,
          originalEvent: e
        });

        observer.complete();
      } else { 
        observer.error({
          type: "error",
          status,
          originalEvent: e
        });
      }
    };

    script.onload = script.onreadystatechanged = script.onerror = handler;

    const head = window.document.getElementsByTagName("head")[0];
    head.insertBefore(script,head.firstChild);

  });
}
