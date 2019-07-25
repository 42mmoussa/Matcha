module.exports = function (server) {

    var mod   = require("./mod");
    var io    = require('socket.io').listen(server);
    var ent   = require('ent');

    io.sockets.on('connection', function (socket) {

		socket.on('joinRoom', (room) => {
			console.log("JOINED ROOM " + room);
			
			socket.join(room);
		});

		socket.on('send_notif', (data) => {
			socket.in(data.id).emit('notifMsg', data);
		});

		socket.on('message', function (data) {
			let message = ent.encode(data.message);
			let key = ent.encode(data.key);
			let to = ent.encode(data.to);
			let from = {
				username: ent.encode(data.fromuid),
				id: ent.encode(data.fromid)
			}
			let now = new Date(Date.now()).toISOString().replace(/T/, ' ').replace(/\..+/, '');

			mod.pool.getConnection()
			.then(conn => {
				conn.query("USE matcha")
				.then(() => {
					return (conn.query("SELECT * FROM matchat WHERE (id_usr1=? AND id_usr2=?) OR (id_usr1=? AND id_usr2=?);", [to, from.id, from.id, to]));
				})
				.then((row) => {
					if (row.length !== 1) {
						throw "You did not matched with this user";
					}
					conn.query("INSERT INTO messages(`id_usr`, `key`, `message`, `date`) VALUES(?, ?, ?, ?)",
					[from.id, key, message, now]);
					conn.end();
				})
				.catch(err => {
					conn.end();
					console.log("\n\n" + err);
				});
			})
            socket.in(key).emit('message', {pseudo: from.username, message: message});
			socket.in(to).emit('notifMsg',
				{
					from: from,
					msg: message,
					url: "/matchat/",
					title: "New message: "

				});
        });
    });
}
