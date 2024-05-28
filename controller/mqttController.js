const asyncHandler = require('express-async-handler');
const { getClient } = require('./mqttClient');
const { subscribeTopic } = require('./mqttPubSub');

// Init MQTT connection
exports.mqttConnect = asyncHandler(async (req, res, next) => {
    const client = getClient(process.env.CONTROLLER_ID);
    client.on('close', () => {
        req.mqtt = false;
        console.log('Disconnected...');
    });
    await subscribeTopic(client);
    req.mqtt = true;
    next();
});

exports.mqttEvents = asyncHandler(async (req, res, next) => {
    const client = getClient(process.env.CONTROLLER_ID);
    // Message Event handlers
    if (req.mqtt === true) {
        client.on('message', (topic, message) => {
            console.log(`${topic}:${message.toString()}`);
        });
    }
    next();
});
