const asyncHandler = require('express-async-handler');
const { publishMessage } = require('./mqttClient');

// Publish MQTT message
exports.valueTest = asyncHandler(async (req, res, next) => {
    const data1 = {
        controller: process.env.CONTROLLER_ID,
        type: 'vlr',
        deviceName: 'capteurGaz',
        characteristic: { name: 'consommationGaz', uuid: 4442, value: 26 },
    };
    const data2 = {
        controller: process.env.CONTROLLER_ID,
        type: 'cmd',
        deviceName: 'capteurGaz',
        characteristic: { name: 'status', uuid: 4441, value: 'off' },
    };
    publishMessage('vlr', 'capteurGaz', data1);
    publishMessage('cmd', 'capteurGaz', data2);
    next();
});
