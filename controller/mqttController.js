const asyncHandler = require('express-async-handler');
const { getClient } = require('./mqttClient');

// Init MQTT connection
exports.mqttConnect = asyncHandler(async (req, res, next) => {
    await getClient(process.env.CONTROLLER_ID);
    req.mqtt = true;
    next();
});

exports.mqttEvents = asyncHandler(async (req, res, next) => {
    await getClient(process.env.CONTROLLER_ID);
    next();
});
