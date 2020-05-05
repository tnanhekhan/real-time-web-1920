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

// region map dependencies
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
    placeholder: 'Enter your location:',
    targetType: 'glass-button',
    limit: 10,
    keepOpen: true
});

let claimedParkingSpaceVector = new ol.source.Vector()

let claimedParkingSpaceLayer = new ol.layer.Vector({
    source: claimedParkingSpaceVector
})

map.addLayer(claimedParkingSpaceLayer);
map.addControl(geoCoder);
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

document.addEventListener("click", (e) => {
    if (e.target && e.target.className.includes("go-to-button")) {
        const coordsString = e.target.dataset.coords.split(",");
        const coords = [Number(coordsString[0]), Number(coordsString[1])]
        const latLng = ol.proj.toLonLat(coords);
        const lat = latLng[1];
        const lng = latLng[0];

        mapView.animate({
            center: coords,
            zoom: 21,
            duration: 2000,
        });
        showParkingSpaceInfo(lat, lng, coords);
    }
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

function showParkingSpaceInfo(lat, lng, coords) {
    document.getElementById("loader").style.display = "block";
    parkingSpaceInfo.style.display = "none";

    socket.emit("fetch parkingSpaceInfo", {lat: lat, lng: lng, coords: coords});
    socket.on("fetch parkingSpaceInfo", data => {
        document.getElementById("loader").style.display = "none";
        const infoElements = parkingSpaceInfo.children;

        if (data.isParkingSpace) {
            infoElements["parking-space-info-title"].innerHTML = data.name;
            infoElements["parking-space-info-subtitle"].innerHTML = data.id;
            infoElements["parking-space-info-content"].innerHTML = data.details;
            document.getElementById("parking-space-info-thumb").src = data.thumb;

            let isClaimed;
            Array.from(document.getElementById("parking-space-available-container").children).forEach(child => {
                if (child.id === data.id) {
                    isClaimed = true
                }
            });

            if (isClaimed) {
                infoElements["parking-space-claim-button"].style.display = "none";
                infoElements["parking-space-unclaim-button"].style.display = "block";
            } else {
                infoElements["parking-space-claim-button"].style.display = "block";
                infoElements["parking-space-unclaim-button"].style.display = "none";
            }

            infoElements["parking-space-claim-button"].onclick = () => {
                socket.emit("claim", {
                    coordinates: coords,
                    id: data.id,
                    details: data.details,
                    name: data.name
                });

                infoElements["parking-space-claim-button"].style.display = "none";
                infoElements["parking-space-unclaim-button"].style.display = "block";
            };

            infoElements["parking-space-unclaim-button"].onclick = () => {
                socket.emit("unclaim", data.id);
                infoElements["parking-space-claim-button"].style.display = "block";
                infoElements["parking-space-unclaim-button"].style.display = "none";
            };
            parkingSpaceInfo.style.display = "block";
        }
    });
}

// Get Lat Long from click
map.on('click', (evt) => {
    const coords = ol.proj.toLonLat(evt.coordinate);
    const lat = coords[1];
    const lng = coords[0];

    parkingSpaceInfo.style.display = "none";
    history.replaceState(null, null, ' ');
    showParkingSpaceInfo(lat, lng, evt.coordinate);
});

//endregion

//region map socket events
function addParkingSpaceToVector(parkingSpace) {
    const claimedParkingSpace = new ol.Feature({
        geometry: new ol.geom.Point(parkingSpace.coordinates),
        details: parkingSpace.details,
        name: parkingSpace.name
    });

    claimedParkingSpace.setId(parkingSpace.id);
    claimedParkingSpace.setStyle(new ol.style.Style({
        image: new ol.style.Icon(({
            crossOrigin: 'anonymous',
            src: '/img/car.png',
            scale: 0.5
        }))
    }));

    claimedParkingSpaceVector.addFeature(claimedParkingSpace);
}

function insertIntoParkingSpaceList(parkingSpace) {
    document.getElementById("parking-space-available-container").insertAdjacentHTML("beforeend",
        `<div class="card" id="${parkingSpace.id}" >
            <header class="card-header">
                <p class="card-header-title">
                ${parkingSpace.name}
                </p>
                <a class="card-header-icon">
                    <button class="button is-medium is-link go-to-button" data-coords="${parkingSpace.coordinates}">
                    Go to
                    </button>
                </a>
            </header>
            <div class="card-content">
                <p class="title is-6">${parkingSpace.id}</p>
                <p class="media-content">${parkingSpace.details}</p>
            </div>
        </div>`)
}

socket.on("claim", parkingSpace => {
    addParkingSpaceToVector(parkingSpace);
    insertIntoParkingSpaceList(parkingSpace);
    map.render();
});

socket.on("unclaim", parkingSpaceId => {
    document.getElementById(parkingSpaceId).remove();
    claimedParkingSpaceVector.removeFeature(claimedParkingSpaceVector.getFeatureById(parkingSpaceId));
    map.render();
});

socket.on("fetch claimedParkingSpaces", parkingSpaces => {
    parkingSpaces.forEach(parkingSpace => {
        addParkingSpaceToVector(parkingSpace)
        insertIntoParkingSpaceList(parkingSpace);
    });
    map.render();
})
// endregion