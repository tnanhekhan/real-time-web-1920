const socket = io();
const messages = document.getElementById("messages");
const form = document.forms["chat-bar"]

const openChatButton = document.getElementById("open-chat-button");
const closeChatButton = document.getElementById("close-chat-button");

const openParkingSpacesButton = document.getElementById("open-parking-spaces-button");
const closeParkingSpacesButton = document.getElementById("close-parking-spaces-button");

// region chat logic
form.addEventListener("submit", event => {
    socket.emit('chat message', form.elements.m.value);
    form.elements.m.value = "";
    event.preventDefault(); // prevents page reloading
});

socket.on('chat message', messageHtml => {
    let message = new DOMParser().parseFromString(messageHtml, "text/html").firstChild.lastChild.firstChild;
    messages.appendChild(message);
    messages.scrollIntoView(false)
});

socket.on('video', videoHtml => {
    let video = new DOMParser().parseFromString(videoHtml, "text/html").lastChild.lastChild.firstChild
    messages.appendChild(video);
    messages.scrollIntoView(false)
});
//endregion

// region map logic
let wmsSource = new ol.layer.Tile({
    source: new ol.source.TileWMS({
        // url: 'https://map.data.amsterdam.nl/maps/parkeervakken?service=WMS&request=GetMap&version=1.1.1&layers=alle_parkeervakken%2Cparkeervakken_label&styles=&format=image%2Fpng&transparent=true&identify=false&onLoading=function(t)%7Bvar%20n%3Dt.sourceTarget%3Breturn%20e.handleLoading(n)%7D&onLoad=function(t)%7Bvar%20n%3Dt.sourceTarget%3Breturn%20e.handleLoaded(n)%7D&srs=EPSG%3A28992&width=480&height=949&bbox=121314.31038026694,485028.8119350978,121515.9456401163,485427.7690752142',
        url: 'https://map.data.amsterdam.nl/maps/parkeervakken?service=WMS&request=GetMap&version=1.1.1',
        params: {"layers": "alle_parkeervakken"},
        crossOrigin: "anonymous",
        serverType: "geoServer"
    })
});

let mapView = new ol.View({
    center: ol.proj.fromLonLat([4.895168, 52.370216]),
    zoom: 14
});

let map = new ol.Map({
    target: 'map',
    layers: [new ol.layer.Tile({source: new ol.source.OSM()}), wmsSource],
    view: mapView
});

// https://github.com/jonataswalker/ol-geocoder
let geoCoder = new Geocoder('nominatim', {
    provider: 'osm',
    lang: 'nl-NL',
    placeholder: 'Toets hier uw locatie in:',
    targetType: 'glass-button',
    limit: 10,
    keepOpen: true
});

map.addControl(geoCoder);

// geocoding callback
geoCoder.on('addresschosen', evt => {
    console.log("cool")
});
// endregion

// region click listeners
const chat = document.getElementById("chat")
const parkingSpaces = document.getElementById("parking-spaces")
const parkingSpaceInfo = document.getElementById("parking-space-info")
const parkingSpaceDismissButton = document.getElementById("parking-space-info-dismiss")

openChatButton.addEventListener("click", () => openSideMenu(chat, parkingSpaces));
closeChatButton.addEventListener("click", () => closeSideMenu(chat));
openParkingSpacesButton.addEventListener("click", () => openSideMenu(parkingSpaces, chat));
closeParkingSpacesButton.addEventListener("click", () => closeSideMenu(parkingSpaces));

parkingSpaceDismissButton.addEventListener("click", () => {
    parkingSpaceInfo.style.display = "none";
});

function openSideMenu(menu, otherOpenMenu) {
    if (otherOpenMenu.dataset.open) {
        otherOpenMenu.dataset.open = false;
        otherOpenMenu.style.width = "0";
    }

    menu.dataset.open = true;
    menu.style.width = "33%";
}

function closeSideMenu(menu) {
    menu.dataset.open = false;
    menu.style.width = "0";
}

// Get Lat Long from click
// map.on('click', evt => console.log(evt.coordinate))
map.on('click', (evt) =>{
    const coords = ol.proj.toLonLat(evt.coordinate);
    const lat = coords[1];
    const lng = coords[0];

    fetch(`geo?lat=${lat}&lng=${lng}`)
        .then(response => {
            return response.json()
        })
        .then(data => {
            // Renders parking space claim box
            const infoElements = parkingSpaceInfo.children;
            infoElements["parking-space-info-title"].innerHTML = data.type;
            infoElements["parking-space-info-subtitle"].innerHTML = data.id;
            infoElements["parking-space-info-content"].innerHTML = data.details;

            if (!data.isParkingSpace) {
                infoElements["parking-space-claim-button"].style.display = "none";
            } else {
                infoElements["parking-space-claim-button"].style.display = "block";
            }

            infoElements["parking-space-claim-button"].onclick = () => {
                let point = new ol.geom.Point(evt.coordinate);
                let claimedParkingSpace = new ol.Feature({
                    geometry: point,
                    id: data.id,
                    details: data.details,
                    type: data.type
                });

                claimedParkingSpace.setStyle(new ol.style.Style({
                    image: new ol.style.Icon(({
                        crossOrigin: 'anonymous',
                        src: '/img/car.png',
                        scale: 0.5
                    }))
                }));

                let claimedParkingSpaceVector = new ol.source.Vector({
                    features: [claimedParkingSpace]
                })

                let claimedParkingSpaceLayer = new ol.layer.Vector({
                    source: claimedParkingSpaceVector
                })

                map.addLayer(claimedParkingSpaceLayer)
            };

            parkingSpaceInfo.style.display = "block";
        });
});
// endregion