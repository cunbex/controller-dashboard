const noble = require('@abandonware/noble');

// eslint-disable-next-line prefer-const
let devicesToConnect = [];
const baseCharacteristics = [
    { uuid: 3331, characteristicName: 'temperature' },
    { uuid: 3332, characteristicName: 'niveauCo2' },
    { uuid: 3334, characteristicName: 'humidite' },
    { uuid: 4441, characteristicName: 'status' },
    { uuid: 4442, characteristicName: 'consommationGaz' },
];

exports.startScan = () =>
    new Promise((resolve, reject) => {
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
                reject('Bluetooth is not active');
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
                            devicesToConnect[i].peripheral.advertisement
                                .localName,
                    });
                }
                resolve(frontDevicesToConnect);
            }
        });

        noble.on('error', (err) => {
            console.error('Error occurred:', err);
            reject(err);
        });
    });

exports.connectToDevice = async (uuid) => {
    const device = devicesToConnect.find((obj) => obj.peripheral.uuid === uuid);
    if (!device) {
        console.error('Device to connect not found');
        return {
            success: false,
            status: 400,
            message: 'Device to connect not found',
        };
    }
    if (device.isConnected) {
        console.error('Device already connected');
        return {
            success: false,
            status: 200,
            message: 'Device already connected',
        };
    }
    const selectedDevice = device.peripheral;
    selectedDevice.connect((error) => {
        if (error) {
            console.error('Error connecting to peripheral:', error);
            return {
                success: false,
                status: 400,
                message: 'Error connecting to peripheral',
            };
        }
        console.log(
            'Connected to peripheral:',
            selectedDevice.uuid,
            'Local Name:',
            selectedDevice.advertisement.localName,
        );
        device.isConnected = true;
        discoverServicesAndCharacteristics(device);
        return {
            success: true,
            status: 200,
            message: `Connected to peripheral: ${selectedDevice.advertisement.localName}`,
        };
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
    characteristic.read(async (error, data) => {
        if (error) {
            console.error('Error reading characteristic:', error);
        } else if (data) {
            try {
                const { publishMessage } = require('./mqttClient');
                const dataResult = data.toString('utf-8');
                console.log(
                    'Read characteristic value for',
                    `${characteristic.uuid}:`,
                    dataResult,
                );
                const device = devicesToConnect.find(
                    (obj) =>
                        obj.peripheral.uuid === characteristic._peripheralId,
                );
                const charName = baseCharacteristics.find(
                    (item) => item.uuid == characteristic.uuid,
                );
                if (characteristic.uuid === 4441) {
                    await publishMessage(
                        'cmd',
                        `${device.peripheral.advertisement.localName}`,
                        {
                            controller: process.env.CONTROLLER_ID,
                            type: 'cmd',
                            deviceName: `${device.peripheral.advertisement.localName}`,
                            characteristics: {
                                name: charName.characteristicName,
                                uuid: characteristic.uuid,
                                value: dataResult,
                            },
                        },
                    );
                } else {
                    await publishMessage(
                        'vlr',
                        `${device.peripheral.advertisement.localName}`,
                        {
                            controller: process.env.CONTROLLER_ID,
                            type: 'vlr',
                            deviceName: `${device.peripheral.advertisement.localName}`,
                            characteristic: {
                                name: charName.characteristicName,
                                uuid: characteristic.uuid,
                                value: dataResult,
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
    console.log(
        'Before reduce devicesToConnect:',
        JSON.stringify(devicesToConnect, null, 2),
    );

    const foundCharacteristic = devicesToConnect.reduce((acc, device) => {
        if (device.isConnected) {
            console.log(
                'Inside reduce devicesToConnect:',
                JSON.stringify(devicesToConnect, null, 2),
            );
            const chara = device.characteristics.find(
                (char) => char.uuid == data.characteristic.uuid,
            );
            if (chara) {
                console.log(
                    `Found characteristic ${chara.uuid} in device ${device.peripheral.uuid}`,
                );
                acc = chara;
            }
        }
        return acc;
    }, null);
    if (foundCharacteristic) {
        foundCharacteristic.write(
            Buffer.from(data.characteristic.value, 'utf-8'),
            true,
            (error) => {
                if (error) {
                    console.error('Error writing to characteristic:', error);
                } else {
                    console.log('Write successful');
                }
            },
        );
    }
};
