const noble = require('@abandonware/noble');

const devicesToConnect = [];
function startScan() {
    return new Promise((resolve, reject) => {
        console.log('Scanning for BLE devices...');
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
            if (peripheral.advertisement.localName !== undefined) {
                console.log('Peripheral found:');
                console.log(
                    `  Local Name: ${peripheral.advertisement.localName}`,
                );
                console.log(`UUID: ${peripheral.uuid}`);
                console.log(`MAC Address: ${peripheral.address}`);
                console.log(
                    `Service UUIDs: ${peripheral.advertisement.serviceUuids}`,
                );
                console.log();

                devicesToConnect.push({
                    peripheral,
                    Local_Name: peripheral.advertisement.localName,
                    isConnected: false,
                });
            }
        });
        noble.on('scanStop', () => {
            if (devicesToConnect.length === 0) {
                console.log('No BLE devices found.');
                reject('No BLE devices found.');
            } else {
                console.log('Found devices:');
                devicesToConnect.forEach((device, index) => {
                    console.log(
                        `${index}: ${device.Local_Name} (${device.peripheral.address})`,
                    ); // hna bch tchof li deviceeee li
                });
                resolve(devicesToConnect);
            }
        });

        noble.on('error', (err) => {
            console.error('Error occurred:', err);
            reject(err);
        });
    });
}

/* hadi function drtHa balak tsa3dk bch tala3 lel dashbooooord           

function updateDashboard() {
    const devicesList = document.getElementById('devicesList');
    devicesList.innerHTML = '';

    devicesToConnect.forEach((device, index) => {
        const li = document.createElement('li');
        li.textContent = `${device.Local_Name} (${device.peripheral.address})`;

        const connectButton = document.createElement('button');
        connectButton.textContent = 'Connect';
        connectButton.id = index;
        connectButton.onclick = function() {
            connectToDevice(index);
        };

        li.appendChild(connectButton);
        devicesList.appendChild(li);
    });
}
*/

function connectToDevice(index) {
    const device = devicesToConnect[index];
    if (!device) {
        console.error('Invalid device index.');
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
        discoverServicesAndCharacteristics(selectedDevice);
    });
}
function discoverServicesAndCharacteristics(selectedDevice) {
    selectedDevice.discoverAllServicesAndCharacteristics(
        (error, services, characteristics) => {
            if (error) {
                console.error(
                    'Error discovering services and characteristics:',
                    error,
                );
                selectedDevice.disconnect();
                return;
            }
            console.log(
                'Services and characteristics discovered for device:',
                selectedDevice.uuid,
            );
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
                            // Si c'est une notification, lire la nouvelle valeur
                            readCharacteristic(characteristic);
                        }
                    });
                }
                if (characteristic.properties.includes('write')) {
                    const newValue = Buffer.from('OFF', 'utf-8');
                    writeCharacteristic(characteristic, newValue);
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

function writeCharacteristic(characteristic, value) {
    characteristic.write(value, true, (error) => {
        if (error) {
            console.error('Error writing to characteristic:', error);
        } else {
            console.log('Write successful');
        }
    });
}

/* function disconnectFromDevice(index) {
    return new Promise((resolve, reject) => {
        const device = devicesToConnect[index];
        if (!device) {
            console.error('Invalid device index.');
            reject('Invalid device index.');
            return;
        }

        const selectedDevice = device.peripheral;
        selectedDevice.disconnect(function(error) {
            if (error) {
                console.error('Error disconnecting from peripheral:', error);
                reject(error);
                return;
            }
            console.log('Disconnected from peripheral:', selectedDevice.uuid, 'Local Name:', selectedDevice.advertisement.localName);
            device.isConnected = false;
            resolve();
        });
    });
}
*/
// hnaaaaa ndiro l'appel t3 function scan
startScan()
    .then((devicesToConnect) => {
        console.log('Scan completed. Devices to connect:', devicesToConnect);
        connectToDevice(0); // hna nda5lo index t3 appreilllle li ra7 n connectiwlha
        // Connect premier device fl cas hadi
    })

    .catch((error) => {
        console.error('Error:', error);
    });

const asyncHandler = require('express-async-handler');
const { getClient } = require('./mqttClient');
const { publishMessage } = require('./mqttPubSub');
// Publish MQTT message
exports.nobleTest = asyncHandler(async (req, res, next) => {
    const client = getClient(process.env.CONTROLLER_ID);
    const data1 = {
        controller: process.env.CONTROLLER_ID,
        type: 'vlr',
        device: 'capteurGaz',
        characteristics: { consommationGaz: 19 },
    };
    const data2 = {
        controller: process.env.CONTROLLER_ID,
        type: 'cmd',
        device: 'capteurGaz',
        characteristics: { status: 'On' },
    };
    /*
    if (req.mqtt === true) {
        publishMessage(client, 'vlr', 'capteurGaz', data1);
        publishMessage(client, 'cmd', 'capteurGaz', data2);
    } */
    next();
});
