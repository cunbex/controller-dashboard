const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');

require('dotenv').config();
const errorHandler = require('./middleware/errorHandler');
const { mqttConnect } = require('./controller/mqttController');
const { mqttEvents } = require('./controller/mqttController');

// import routes
const indexRouter = require('./routes/index');
const postRouter = require('./routes/post');

const app = express();

// view engine setup
app.use(expressLayouts);
app.set('layout', './layouts/main');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
    }),
);

// Dynamic routes
app.use(mqttConnect, mqttEvents);
app.use('/', indexRouter);
app.use('/api', postRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});

// error handler
app.use(errorHandler);

module.exports = app;
