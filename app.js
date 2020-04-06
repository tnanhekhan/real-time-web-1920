const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const http = require('http');

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

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    socket.on("chat message", msg => {
        if (new RegExp("^(http(s)?:\/\/)?((w){3}.)?youtu(be|.be)?(\.com)?\/.+").test(msg.trim())) {
            let videoUrl;
            const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = msg.match(regExp);
            if (match && match[2].length == 11) {
                videoUrl = match[2];
            }

            console.log(`youtube link: ${msg} url: ${videoUrl}`)
        } else {
            console.log(`message: ${msg}`)
        }
        io.emit('chat message', msg);
    });
});

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
});

module.exports = app;