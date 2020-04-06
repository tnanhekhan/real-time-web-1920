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
        io.emit('chat message', msg);
        console.log(`message: ${msg}`)
    });
});

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
});

module.exports = app;