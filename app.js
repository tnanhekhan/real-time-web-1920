const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const http = require('http');
const axios = require('axios').default;

const indexRouter = require('./routes/index');
const port = process.env.PORT || 3002;

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);
const MongoDB = require("./data/db.js");
const ParkingSpace = MongoDB.ParkingSpaceModel;

// view engine setup
app.set('views', path.join(__dirname, 'views'))
    .set('view engine', 'ejs')
    .use(logger('dev'))
    .use(express.json())
    .use(express.urlencoded({extended: false}))
    .use(cookieParser())
    .use(express.static(path.join(__dirname, 'public')))
    .use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

// region Socket.IO
io.on('connection', socket => {
    MongoDB.client.connect(MongoDB.uri, {useNewUrlParser: true, useUnifiedTopology: true});
    MongoDB.db.on('error', console.error.bind(console, 'connection error:'));
    MongoDB.db.once('open', () => {
        ParkingSpace.find({isClaimed: true}, (err, parkingSpaces) => {
            io.emit("fetch claimedParkingSpaces", parkingSpaces);
        });
    });

    const rooms = {
        Centrum: "Centrum",
        NieuwWest: "Nieuw-West",
        Noord: "Noord",
        Oost: "Oost",
        West: "West",
        Zuid: "Zuid",
        Zuidoost: "Zuidoost"
    }

    socket.on("set username", username => {
        socket.username = `${username} (${socket.id})`
        socket.join(rooms.Centrum)
        io.to(rooms.Centrum).emit('joined room', `<li style="color: hsl(204, 86%, 53%)"><b>${socket.username}</b> joined ${rooms.Centrum}.</li>`);
        socket.emit("set username")
    });

    socket.on("change room", room => {
        Object.values(rooms).forEach(room => {
            socket.leave(room);
        });
        socket.join(room);
        io.to(room).emit('joined room', `<li style="color:hsl(204, 86%, 53%)"><b>${socket.username}</b> joined ${room}.</li>`);
    });

    socket.on("chat message", data => {
        if (socket.username) {
            const regExp = new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?");
            if (regExp.test(data.message)) {
                const matchedSubstring = regExp.exec(data.message)[0].split(" ");
                const url = `https://noembed.com/embed?url=${matchedSubstring[0]}`;
                const message = data.message.replace(matchedSubstring[0], "");

                axios.get(url)
                    .then(result => {
                        if (!result.data.error) {
                            // If url is valid youtube video, check if included message is before or after the video
                            if (matchedSubstring.length > 1) {
                                io.to(data.room).emit('chat message', `<li><b>${socket.username}:</b> <a href='${result.data.url}'> ${result.data.title} from ${result.data["provider_name"]}</a> ${message}</li>`);
                            } else {
                                io.to(data.room).emit('chat message', `<li><b>${socket.username}:</b> ${message}<a href='${result.data.url}'> ${result.data.title} from ${result.data["provider_name"]}</a></li>`);
                            }
                            io.to(data.room).emit('media', result.data.html)
                        } else {
                            // else check if included message is before or after the other url
                            if (matchedSubstring.length > 1) {
                                io.to(data.room).emit('chat message', `<li><b>${socket.username}:</b> <a href='${result.data.url}'> ${result.data.url}</a> ${message}</li>`);
                            } else {
                                io.to(data.room).emit('chat message', `<li><b>${socket.username}:</b> ${message} <a href='${result.data.url}'>${result.data.url}</a></li>`);
                            }
                        }
                    })
                    .catch(error => {
                        io.to(data.room).emit('chat message', `<li><b>${socket.username}:</b> ${data.message}</li>`);
                        console.log(error);
                    });
            } else {
                io.to(data.room).emit('chat message', `<li><b>${socket.username}:</b> ${data.message}</li>`);
            }
        }
    });

    socket.on("fetch parkingSpaceInfo", data => {
        const endpoint = "https://api.data.amsterdam.nl";
        axios.get(`${endpoint}/parkeervakken/geosearch/?lat=${data.lat}&lon=${data.lng}&item=parkeervak&format=json`)
            .then(geoSearch => {
                const infoUrl = geoSearch.data[0]["_links"].self.href;
                const multiPolygon = geoSearch.data[0].geometrie.coordinates;

                axios.get(endpoint + infoUrl + "?format=json")
                    .then(response => {
                        axios.get(`https://api.data.amsterdam.nl/panorama/thumbnail/?lat=${data.lat}&lon=${data.lng}`)
                            .then(thumbnail => {
                                socket.emit("fetch parkingSpaceInfo", {
                                    isParkingSpace: true,
                                    name: `${response.data.straatnaam}`,
                                    id: response.data.id,
                                    details: `Type: ${response.data.type} Parking Space, Buurtcode: ${response.data.buurtcode}`,
                                    multiPolygon: multiPolygon,
                                    thumb: thumbnail.data.url
                                });
                            })
                            .catch(err => {
                                socket.emit("fetch parkingSpaceInfo", {
                                    isParkingSpace: true,
                                    name: `${response.data.straatnaam}`,
                                    id: response.data.id,
                                    details: `Type: ${response.data.type} Parking Space, Buurtcode: ${response.data.buurtcode}`,
                                    multiPolygon: multiPolygon,
                                    thumb: `https://i.pinimg.com/originals/62/61/5b/62615b10916e312085997ded4910f027.png`
                                });
                            });
                    });
            }).catch(err => {
            socket.emit("fetch parkingSpaceInfo", {isParkingSpace: false});
        });
    });

    socket.on("claim", parkingSpace => {
        MongoDB.client.connect(MongoDB.uri, {useNewUrlParser: true, useUnifiedTopology: true});
        MongoDB.db.on('error', console.error.bind(console, 'connection error:'));
        MongoDB.db.once('open', () => {
            let claimedParkingSpace = new ParkingSpace({
                id: parkingSpace.id,
                coordinates: parkingSpace.coordinates,
                details: parkingSpace.details,
                name: parkingSpace.name,
                isClaimed: true
            });

            ParkingSpace.find({id: (parkingSpace.id).toString()}, (err, docs) => {
                if (docs.length) {
                    ParkingSpace.updateOne({id: parkingSpace.id.toString()}, {isClaimed: true}, (err, res) => {
                        if (err) return console.error(err);
                        io.emit("claim", parkingSpace);
                    });
                } else {
                    claimedParkingSpace.save(err => {
                        if (err) return console.error(err);
                        io.emit("claim", parkingSpace);
                    });
                }
            });
        });
    });

    socket.on("unclaim", parkingSpaceId => {
        MongoDB.client.connect(MongoDB.uri, {useNewUrlParser: true, useUnifiedTopology: true});
        MongoDB.db.on('error', console.error.bind(console, 'connection error:'));
        MongoDB.db.once('open', () => {
            ParkingSpace.updateOne({id: parkingSpaceId.toString()}, {isClaimed: false}, (err, res) => {
                io.emit("unclaim", parkingSpaceId);
            });
        });
    });
});
// endregion

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
});

module.exports = app;
