const express = require('express');
var app = express();
var http = require('http').Server(app);
var MobileDetect = require('mobile-detect');
var session = require('express-session');
var FileStore = require('session-file-store')(session);

// Initialize the session
app.use(session({
    store: new FileStore(),
    secret: 'martijniscool123456',
    resave: false,
    saveUninitialized: true,
    cookie: {
        // in miliseconds, this is one hour
        maxAge: 3600000,
    }
}));

// Routing for the game
app.get('/', function(req, res) {   // TODO: Enable mobile detect again
    // Use this to check if the browser is a mobile one
    // md = new MobileDetect(req.headers['user-agent']);

    // If the browser is not a mobile one, don't allow to play the game
    // if (!md.mobile()) {
    //     res.sendFile(`${__dirname}/client/not-mobile.html`);
    // } else {
    res.sendFile(`${__dirname}/client/dotsmash.html`);
    // }
});
app.get('/dotsmash.js', function (req, res) { res.sendFile(`${__dirname}/client/dotsmash.js`); });

// Socket code for each connected client
// io.on('connection', function(socket){
//     // Log that a client is connected, for debug purposes
//     console.log(`user connected: ${socket.id}`);
// 
//     // Log if a client disconnects, for debug purposes
//     socket.on('disconnect', function(){
//         console.log(`user disconnected: ${socket.id}`);
//     });
// });

// Normal HTTP
// Listen on port 80
http.listen(80, function(){
    // Log that we're actually active, for debug purposes
    console.log('listening on *:80');
});

const GameRoom = require("./server/game-room").GameRoom;
var gameRoom = new GameRoom(http);