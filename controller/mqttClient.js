const mqtt = require('mqtt');
const fs = require('fs');
const { writeCharacteristic } = require('./noble');
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

const publishOptions = {
    qos: 1,
    retain: true,
    dup: false,
};
const subscribeOptions = {
    qos: 0,
};

const publishMessage = async (type, device, value) => {
    client.publish(
        `${process.env.CONTROLLER_ID}/${type}/${device}`,
        JSON.stringify(value),
        publishOptions,
        (err) => {
            if (err) {
                console.error('Error Publishing to topic:', err);
            } else {
                console.log(
                    `Published to: ${process.env.CONTROLLER_ID}/${type}/${device}`,
                );
            }
        },
    );
};
const subscribeTopic = async () => {
    client.subscribe(
        [
            `${process.env.CONTROLLER_ID}/cmd/#`,
            `${process.env.CONTROLLER_ID}/lwt/`,
            `${process.env.CONTROLLER_ID}/vlr/#`,
        ],
        {
            subscribeOptions,
        },
        (err, granted) => {
            if (err) {
                console.error('Error subscribing to topic:', err);
            } else if (granted) {
                console.log(`Subscribed to: ${JSON.stringify(granted)}`);
            }
        },
    );
};

async function getClient() {
    if (!client) {
        client = mqtt.connect(brokerUrl, options);

        // Connection Event handlers
        client.on('connect', () => {
            console.log('Connected to MQTT broker');
        });
        client.on('reconnect', () => {
            console.log('Reconnecting...');
        });
        client.on('close', () => {
            console.log('Disconnected...');
        });
        client.on('error', (err) => {
            console.error('MQTT client error:', err);
        });
        client.on('message', async (topic, message) => {
            console.log(`Received: ${message.toString()}`);
            await writeCharacteristic(JSON.parse(message.toString()));
        });
        await subscribeTopic();
    }
    return client;
}

module.exports = {
    getClient,
    publishMessage,
    subscribeTopic,
};
