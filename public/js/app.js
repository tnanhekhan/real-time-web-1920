// region dependencies
const socket = io();
const messages = document.getElementById("messages");
const form = document.forms["chat-bar"]
// endregion

// region chat logic
// form.addEventListener("submit", event => {
//     socket.emit('chat message', form.elements.m.value);
//     form.elements.m.value = "";
//     event.preventDefault(); // prevents page reloading
// });
//
// socket.on('chat message', messageHtml => {
//     let message = new DOMParser().parseFromString(messageHtml, "text/html").firstChild.lastChild.firstChild;
//     messages.appendChild(message);
//     messages.scrollIntoView(false)
// });
//
// socket.on('video', videoHtml => {
//     let video = new DOMParser().parseFromString(videoHtml, "text/html").lastChild.lastChild.firstChild
//     messages.appendChild(video);
//     messages.scrollIntoView(false)
// });
//endregion

// region map logic
let map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        }),
        new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: "https://map.data.amsterdam.nl/maps/parkeervakken?REQUEST=GetCapabilities&VERSION=1.1.0&SERVICE=wms"
            })
        })
    ],
    view: new ol.View({
        center: ol.proj.fromLonLat([4.895168, 52.370216]),
        zoom: 14
    })
});

// https://github.com/jonataswalker/ol-geocoder
let geoCoder = new Geocoder('nominatim', {
    provider: 'osm',
    lang: 'nl-NL',
    placeholder: 'Toets hier uw locatie in:',
    targetType: 'glass-button',
    limit: 8,
    keepOpen: true
});

map.addControl(geoCoder);

// geocoding callback
geoCoder.on('addresschosen', evt => {
    console.log("cool")
});
// endregion