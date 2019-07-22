var express = require('express');
var router = express.Router();
var mod = require('./mod');

router.get('/', function (req, res) {
    if (req.session.connect) {
		mod.pool.getConnection()
			.then(conn => {
				conn.query("USE matcha")
				.then(() => {
					return (conn.query("SELECT * FROM users\n\
						WHERE (id_usr IN (SELECT id_usr2 FROM matchat WHERE id_usr1=?))\n\
						OR (id_usr IN (SELECT id_usr1 FROM matchat WHERE id_usr2=?))",
						[req.session.user.id, req.session.user.id]));
				}).then (row => {
					conn.end();
					return res.render('tochat', {
						nb_users: row.length,
						users: row
					});
				})
			});
    } else {
        return res.redirect('/login');
    }
});

router.get('/:id_usr', function (req, res) {
	if (req.session.connect) {
		let id_usr = req.params.id_usr;	
		mod.pool.getConnection()
			.then(conn => {
				conn.query("USE matcha")
				.then(() => {
					return (conn.query("SELECT * FROM matchat WHERE (id_usr1=? AND id_usr2=?) OR (id_usr1=? AND id_usr2=?);", [id_usr, req.session.user.id, req.session.user.id, id_usr]));
				})
				.then (row => {
					if (row.length === 1) {
						let key = row[0].key;
						conn.query("SELECT * FROM users WHERE id_usr=?;", [id_usr])
						.then(row2 => {
							conn.query("SELECT message, DATE_FORMAT(date, '%D %M %Y') as date, DATE_FORMAT(date, '%H:%i:%s') as time, id_usr FROM messages WHERE `key`=? ORDER BY date ASC LIMIT 50;", [key])
							.then(row3 => {
								conn.end();
								console.log(key);
								return res.render('matchat', {
									user: row2[0],
									idToChat: id_usr,
									key: key,
									msg: row3
								});
							});
						});
					} else {
						console.log("no match with this user");
						conn.end();
						return res.redirect('/');
					}
				})
			});
    } else {
        return res.redirect('/login');
    }
});

module.exports = router;
