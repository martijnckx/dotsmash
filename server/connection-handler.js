class ConnectionHandler {
    /**
     * 
     * @param {any} http Http object.
     */
    constructor(http) {
        var thisobj = this;
        this.io = require('socket.io')(http);
        this.io.on('connection', function (socket) { thisobj.Connecting(socket); });
    }

    /**
     * 
     * @param {SocketIO.Socket} socket New incoming socket
     */
    Connecting(socket) {
        console.log(`user connected: ${socket.id}`);
        socket.on('message-to-server', function (msg) {
            console.log(msg);
        });
        var thisobj = this;
        socket.on('disconnect', function () {
            thisobj.Disconnecting(socket);
        });
    }

    /**
     * 
     * @param {SocketIO.Socket} socket New incoming socket
     */
    Disconnecting(socket) {
        console.log(`user disconnected: ${socket.id}`);
    }
}

module.exports = {
    ConnectionHandler
};