const mqtt = require('mqtt');
const fs = require('fs');

// MQTT broker URL
const brokerUrl = process.env.BROKER_URL;

// Import CA cert
const ca = fs.readFileSync(process.env.CERT_PATH).toString();

let client;

const options = {
    clientId: process.env.CONTROLLER_ID,
    protocolId: 'MQTT',
    protocolVersion: 4,
    keepalive: 3600,
    reconnectPeriod: 5 * 1000,
    connectTimeout: 6 * 1000,
    will: {
        topic: `${process.env.CONTROLLER_ID}/lwt`,
        payload: `${process.env.CONTROLLER_ID} disconnected without a reason`,
        qos: 0,
        retain: false,
    },
    username: process.env.CONTROLLER_USERNAME,
    password: process.env.CONTROLLER_PASSWORD,
    clean: false,
    ca,
};

function getClient() {
    if (!client) {
        client = mqtt.connect(brokerUrl, options);

        // Connection Event handlers
        client.on('connect', () => {
            console.log('Connected to MQTT broker');
        });
        client.on('reconnect', () => {
            console.log('Reconnecting...');
        });
        client.on('error', (err) => {
            console.error('MQTT client error:', err);
        });
    }
    return client;
}

module.exports = {
    getClient,
};
