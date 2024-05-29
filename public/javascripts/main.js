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
            const response = await fetch(
                'http://localhost:3000/api/startScan',
                {
                    method: 'GET',
                },
            );
            const data = await response.json();
            console.log(data);
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
