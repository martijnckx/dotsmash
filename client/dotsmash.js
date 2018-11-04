var socket = io();
socket.on('message-from-server', function (msg) {
    console.log("Message from server: " + msg);
});
socket.emit('message-to-server', "Hi server!");
socket.emit('message-to-everyone', "Hi everyone!");