const publishOptions = {
    qos: 1,
    retain: true,
    dup: false,
};
const subscribeOptions = {
    qos: 0,
};

const publishMessage = async (client, type, device, value) => {
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
const subscribeTopic = async (client) => {
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
module.exports = {
    publishMessage,
    subscribeTopic,
};
