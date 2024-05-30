const noble = require('@abandonware/noble');
const { publishMessage } = require('./mqttClient');

// eslint-disable-next-line prefer-const
let devicesToConnect = [];
const baseCharacteristics = [
    { uuid: 3331, characteristicName: 'temperature' },
    { uuid: 3332, characteristicName: 'niveauCo2' },
    { uuid: 3334, characteristicName: 'humidite' },
    { uuid: 4441, characteristicName: 'status' },
    { uuid: 4442, characteristicName: 'consommationGaz' },
];
exports.startScan = () => {
    noble.on('stateChange', (state) => {
        if (state === 'poweredOn') {
            console.log('Bluetooth is active, starting scan...');
            noble.startScanning();
            setTimeout(() => {
                console.log('Scan finished.');
                noble.stopScanning();
            }, 4000);
        } else {
            console.log('Bluetooth is not active');
            noble.stopScanning();
            return 'Bluetooth is not active';
        }
    });
    noble.on('discover', (peripheral) => {
        console.log('Scanning for BLE devices...');
        if (peripheral.advertisement.localName !== undefined) {
            const exists = devicesToConnect.some(
                (obj) => obj.peripheral.uuid === peripheral.uuid,
            );
            if (!exists) {
                devicesToConnect.push({
                    peripheral,
                    isConnected: false,
                });
            }
        }
    });
    noble.on('scanStop', () => {
        if (devicesToConnect.length !== 0) {
            const frontDevicesToConnect = [];
            for (let i = 0; i < devicesToConnect.length; i++) {
                frontDevicesToConnect.push({
                    uuid: devicesToConnect[i].peripheral.uuid,
                    localName:
                        devicesToConnect[i].peripheral.advertisement.localName,
                });
            }
            return frontDevicesToConnect;
        }
    });

    noble.on('error', (err) => {
        console.error('Error occurred:', err);
        return err;
    });
};

exports.connectToDevice = (uuid) => {
    const device = devicesToConnect.find((obj) => obj.peripheral.uuid === uuid);
    if (!device) {
        console.error('Device to connect not found');
        return;
    }
    if (device.isConnected) {
        console.error('Device already connected');
        return;
    }
    const selectedDevice = device.peripheral;
    selectedDevice.connect((error) => {
        if (error) {
            console.error('Error connecting to peripheral:', error);
            return;
        }
        console.log(
            'Connected to peripheral:',
            selectedDevice.uuid,
            'Local Name:',
            selectedDevice.advertisement.localName,
        );
        device.isConnected = true;
        discoverServicesAndCharacteristics(device);
    });
};
function discoverServicesAndCharacteristics(device) {
    device.peripheral.discoverAllServicesAndCharacteristics(
        (error, services, characteristics) => {
            if (error) {
                console.error(
                    'Error discovering services and characteristics:',
                    error,
                );
                device.peripheral.disconnect();
                device.isConnected = false;
                return;
            }
            device.characteristics = [];
            characteristics.forEach((characteristic) => {
                if (characteristic.properties.includes('notify')) {
                    // S'abonner aux notifications
                    characteristic.subscribe((error) => {
                        if (error) {
                            console.error(
                                'Error subscribing to characteristic:',
                                error,
                            );
                        } else {
                            console.log(
                                'Subscribed to characteristic:',
                                characteristic.uuid,
                            );
                        }
                    });
                    characteristic.on('data', (data, isNotification) => {
                        if (isNotification) {
                            console.log(
                                'Characteristic value changed for',
                                `${characteristic.uuid}:`,
                                data.toString('utf-8'),
                            );
                            readCharacteristic(characteristic);
                        }
                    });
                    device.characteristics.push(characteristic);
                }
            });
        },
    );
}

function readCharacteristic(characteristic) {
    characteristic.read((error, data) => {
        if (error) {
            console.error('Error reading characteristic:', error);
        } else if (data) {
            try {
                const value = data.toString('utf-8');
                console.log(
                    'Read characteristic value for',
                    `${characteristic.uuid}:`,
                    value,
                );
                const device = devicesToConnect.find(
                    (obj) =>
                        obj.peripheral.uuid === characteristic._peripheralId,
                );
                const charName = baseCharacteristics.find(
                    (item) => item.uuid === characteristic.uuid,
                );
                if (characteristic.uuid === 4441) {
                    publishMessage(
                        'cmd',
                        `${device.peripheral.advertisement.localName}`,
                        {
                            controller: process.env.CONTROLLER_ID,
                            type: 'cmd',
                            device: `${device.peripheral.advertisement.localName}`,
                            characteristics: {
                                name: charName,
                                uuid: characteristic.uuid,
                                value,
                            },
                        },
                    );
                } else {
                    publishMessage(
                        'vlr',
                        `${device.peripheral.advertisement.localName}`,
                        {
                            controller: process.env.CONTROLLER_ID,
                            type: 'vlr',
                            deviceName: `${device.peripheral.advertisement.localName}`,
                            characteristic: {
                                name: charName,
                                uuid: characteristic.uuid,
                                value,
                            },
                        },
                    );
                }
            } catch (e) {
                console.error('Error converting data to string:', e);
            }
        } else {
            console.log(
                'No data received for characteristic:',
                characteristic.uuid,
            );
        }
    });
}

/* IMPLIMENT WRITE */
exports.writeCharacteristic = async (data) => {
    const characteristic = devicesToConnect.characteristics.find(
        (obj) => obj.uuid === data.characteristic.uuid,
    );
    characteristic.write(data.characteristic.value, true, (error) => {
        if (error) {
            console.error('Error writing to characteristic:', error);
        } else {
            console.log('Write successful');
        }
    });
};
