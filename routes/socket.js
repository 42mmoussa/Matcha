module.exports = function (server) {

    var mod   = require("./mod");
    var io    = require('socket.io').listen(server);
	var ent   = require('ent');
	users = [];

    io.sockets.on('connection', function (socket) {
		
		function updateStatus(){
			io.sockets.emit('status', users);
		}

		socket.on('joinRoom', (room, id_usr) => {
			socket.user = id_usr;
			users[socket.user] = {online: true};
			socket.join(room);
			updateStatus();
		});

    	socket.on('send_notif', (data) => {

    		socket.in(data.id).emit('notifMsg', data);

        	if (data.type === 'visit') {
				mod.pool.getConnection()
				.then(conn => {
					conn.query("USE matcha")
					.then(() => {
						return (conn.query("SELECT * FROM notifications WHERE id_usr = ? AND cast(date as Date) = cast(Now() as Date);", [data.id]));
					})
					.then((row) => {
						if (row.length === 0) {
							conn.query("UPDATE profiles SET `read` = 0 WHERE id_usr = ?", [data.id]);
							conn.query("INSERT INTO notifications(`id_usr`, `id`, `username`, `link`, `msg`, `title`) VALUES(?, ?, ?, ?, ?, ?)",
							[data.id, data.from.id, data.from.username, "/profile?id=" + data.from.id, "This user visited your profile", "Visit from: "]);
						}
						conn.end();
					})
					.catch(err => {
						console.log(err);
						conn.end();
					});
				})
        	}
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
					conn.query("INSERT INTO notifications(`id_usr`, `id`, `username`, `link`, `msg`, `title`) VALUES(?, ?, ?, ?, ?, ?)",
					[to, from.id, from.username, "/matchat/" + from.id, message, "Message from: "]);
					conn.end();
				})
				.catch(err => {
					console.log(err);
					conn.end();
				});
			});
			socket.in(key).emit('message', {pseudo: from.username, message: message});
			socket.in(to).emit('notifMsg', {
				from: from,
				msg: message,
				link: "/matchat/",
				title: "Message from: "
			});
		});

		socket.on('disconnect', function() {
			if(!socket.user || socket.user === undefined) return;
			users[socket.user].online = false;
			users[socket.user].visit = new Date().toISOString().replace('T', ' ').substr(0, 16);
			updateStatus();
		});

	});
}
