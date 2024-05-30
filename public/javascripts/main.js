async function startScan() {
    const responseScan = await fetch('http://localhost:3000/api/startScan', {
        method: 'GET',
    });
    const scanResult = await responseScan.json();
    return scanResult;
}
async function connectDevice(deviceId) {
    const connectResponse = await fetch(
        'http://localhost:3000/api/connectDevice',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                deviceId,
            }),
        },
    );
    const connectResult = await connectResponse.json();
    if (connectResult.status === 200 && connectResult.success) {
        document.querySelector(`#${deviceId}`).style.backgroundColor = 'green';
        alert(connectResult.message);
    } else if (connectResult.status === 200 && !connectResult) {
        document.querySelector(`#${deviceId}`).style.backgroundColor = 'blue';
        alert(connectResult.message);
    } else if (connectResult.status === 400 && !connectResult) {
        document.querySelector(`#${deviceId}`).style.backgroundColor = 'red';
        alert(connectResult.message);
    }
}

if (document.querySelector('#logInButton')) {
    document
        .querySelector('#logInButton')
        .addEventListener('click', async (event) => {
            event.preventDefault();
            const { value } = document.querySelector('#password');
            const response = await fetch('http://localhost:3000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password: value,
                }),
            });
            const data = await response.json();
            if (data.success === true) {
                window.location.href = '/dashboard';
            }
        });
}
if (document.querySelector('#startScan')) {
    document
        .querySelector('#startScan')
        .addEventListener('click', async (event) => {
            event.preventDefault();
            const scanResult = await startScan();
            // Get the ul element
            const ul = document.querySelector('.scanResult');
            scanResult.message.forEach((element) => {
                // Create a new li element
                const li = document.createElement('li');

                // Create a new p element and set its text content
                const p = document.createElement('p');
                p.textContent = element.localName;

                // Create a new button element and set its text content
                const button = document.createElement('button');
                button.textContent = 'Connect';
                button.id = element.uuid;

                button.addEventListener('click', async (e) => {
                    e.preventDefault();
                    connectDevice(button.id);
                });

                // Append the p and button elements to the li
                li.appendChild(p);
                li.appendChild(button);

                // Append the li to the ul
                ul.appendChild(li);
            });
        });
}

const ws = new WebSocket('ws://localhost:3000');

ws.onopen = () => {
    console.log('Connected to WebSocket server');
};

ws.onmessage = (event) => {
    // Parse the JSON data
    const parsedData = JSON.parse(event.data);
    console.log('recieved on frontend websocket:', parsedData);
};

ws.onclose = () => {
    console.log('Disconnected from WebSocket server');
};
