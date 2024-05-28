const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const expressLayouts = require('express-ejs-layouts');

require('dotenv').config();
const errorHandler = require('./middleware/errorHandler');
const { mqttConnect } = require('./controller/mqttController');
const { mqttEvents } = require('./controller/mqttController');
const { nobleTest } = require('./controller/nobleTest');

// import routes
const indexRouter = require('./routes/index');

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

// Dynamic routes
app.use(mqttConnect, mqttEvents, nobleTest);
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
    next(createError(404));
});

// error handler
app.use(errorHandler);

module.exports = app;
