class GameRoom {
    /**
     * 
     * @param {any} http Http object.
     */
    constructor(http) {
        var thisobj = this;
        this.io = require('socket.io')(http);
        this.io.on('connection', function (socket) { thisobj.Connecting(socket); });
        this.connected = [];
    }

    /**
     * 
     * @param {SocketIO.Socket} socket New incoming socket
     */
    Connecting(socket) {
        var thisobj = this;
        this.connected.push(socket);
        console.log(`user connected: ${socket.id}`);
        socket.on('message-to-server', function (msg) {
            console.log(`${socket.id} says to me: ${msg}`);
        });
        socket.on('message-to-everyone', function (msg) {
            console.log(`${socket.id} says to everyone: ${msg}`);
            for (var i in thisobj.connected) {
                thisobj.connected[i].emit('message-from-server', `${socket.id} says to everyone: ${msg}`);
            }
        });
        socket.on('disconnect', function () { thisobj.Disconnecting(socket); });
    }

    /**
     * 
     * @param {SocketIO.Socket} socket New incoming socket
     */
    Disconnecting(socket) {
        console.log(`user disconnected: ${socket.id}`);
        this.connected.splice(this.connected.indexOf(socket), 1);
    }
}

module.exports = {
    GameRoom
};