const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.set('views', __dirname);

app.set('view engine', 'ejs');
// Middleware for parsing request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Parse incoming requests with JSON payloads
app.use(bodyParser.json());

// Parse incoming requests with urlencoded payloads
app.use(bodyParser.urlencoded({ extended: true }));

let users = [];

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

const { v4: uuidv4 } = require('uuid');
const secretKey = uuidv4();

// Use express session middleware
app.use(session({
    secret: secretKey,
    resave: false,
    saveUninitialized: true
}));

app.post('/login', (req, res) => {
    const { username } = req.body;
    req.session.username = username;  // Store the username in the session
    res.redirect('/chat'); // Redirect to the chat page
});

app.get('/chat', (req, res) => {
    const username = req.session.username;
    res.sendFile(__dirname + '/chat.html');
});


io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('new user', (username) => {
        console.log('User ' + username + ' connected');
        users.push(username);
        io.emit('users online', users);
    });

    socket.on('chat message', (data) => {
        console.log('Message received from ' + data.username + ': ' + data.message);
        io.emit('chat message', { username: data.username, message: data.message });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
        users = users.filter(user => user !== socket.username);
        io.emit('users online', users);
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
