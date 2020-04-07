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

// Setup Socket.IO
io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on("chat message", msg => {
        const regExp = new RegExp("([a-zA-Z0-9]+://)?([a-zA-Z0-9_]+:[a-zA-Z0-9_]+@)?([a-zA-Z0-9.-]+\\.[A-Za-z]{2,4})(:[0-9]+)?(/.*)?");
        if (regExp.test(msg)) {
            const matchedSubstring = regExp.exec(msg)[0].split(" ");
            const url = `https://noembed.com/embed?url=${matchedSubstring[0]}`;
            const message = msg.replace(matchedSubstring[0], "");

            axios.get(url)
                .then(result => {
                    if (!result.data.error) {
                        // If url is valid youtube video, check if included message is before or after the video
                        if (matchedSubstring.length > 1) {
                            io.emit('chat message', `<li><a href='${result.data.url}'> ${result.data.title} from ${result.data["provider_name"]}</a> ${message}</li>`);
                        } else {
                            io.emit('chat message', `<li>${message}<a href='${result.data.url}'> ${result.data.title} from ${result.data["provider_name"]}</a></li>`);
                        }
                        io.emit('video', result.data.html)
                    } else {
                        // else check if included message is before or after the other url
                        if (matchedSubstring.length > 1) {
                            io.emit('chat message', `<li><a href='${result.data.url}'> ${result.data.url}</a> ${message}</li>`);
                        } else {
                            io.emit('chat message', `<li>${message} <a href='${result.data.url}'>${result.data.url}</a></li>`);
                        }
                    }
                })
                .catch(error => {
                    io.emit('chat message', `<li>${msg}</li>`);
                    console.log(error);
                });
        } else {
            io.emit('chat message', `<li>${msg}</li>`);
        }
    });
});

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
});

module.exports = app;