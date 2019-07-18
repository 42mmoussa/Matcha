module.exports = function (server) {

    var mod   = require("./mod");
    var io    = require('socket.io').listen(server);
    var ent   = require('ent');

    io.sockets.on('connection', function (socket) {

        // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
        socket.on('message', function (pseudo, message) {
            message = ent.encode(message);
            socket.broadcast.emit('message', {pseudo: pseudo, message: message});
        });
    });
}
