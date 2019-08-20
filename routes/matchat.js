var express = require('express');
var router = express.Router();
var mod = require('./mod');

router.get('/', function (req, res) {
    if (req.session.connect) {
      if (req.session.user.age < 18) {
        return res.redirect("/settings/change-birthdate");
      }
  		iframe = req.query.iframe;
  		if (isNaN(iframe))
  			iframe = 0;
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
						users: row,
						iframe: iframe
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
							conn.query("(SELECT id_messages as id, message, DATE_FORMAT(date, '%D %M %Y') as day, DATE_FORMAT(date, '%H:%i') as time, id_usr FROM messages WHERE `key`=? ORDER BY id_messages DESC LIMIT 50) ORDER BY id ASC;", [key])
							.then(row3 => {
								conn.end();
								return res.render('matchat', {
									user: row2[0],
									idToChat: id_usr,
									key: key,
									msg: row3,
									nb_msg: row3.length
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

router.post('/loadmore', function (req, res) {
	if (req.session.connect) {
		const ent          = require("ent");
		let nbscroll = req.body.nbscroll * 50;
		let key = ent.encode(req.body.room);

		mod.pool.getConnection()
			.then(conn => {
				conn.query("USE matcha")
				.then(() => {
					return (
						conn.query(
							"(SELECT id_messages as id, message, DATE_FORMAT(date, '%D %M %Y') as day,\n\
							DATE_FORMAT(date, '%H:%i') as time, id_usr\n\
							FROM messages WHERE `key`=?\n\
							ORDER BY id_messages DESC LIMIT ?, 50)\n\
							ORDER BY id DESC;",
							[key, nbscroll]));
				})
				.then (row => {
  					res.send({
  						nb: row.length,
  						msg: row
            });
				})
			});
    } else {
        return res.redirect('/login');
    }
});

module.exports = router;
