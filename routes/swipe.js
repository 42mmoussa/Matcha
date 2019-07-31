const express = require('express');
const router = express.Router();
const mod = require('./mod');
const uniqid = require('uniqid');

router.get('/', function(req, res) {
	if (req.session.connect) {	
	mod.pool.getConnection()
		.then(conn => {
		conn.query("USE matcha")
		.then(() => {
			return conn.query("SELECT * FROM profiles WHERE id_usr=?", [req.session.user.id]);
		}).then((profile) => {
			let b = 0;
			let search = '';
			if (/Heterosexual/.test(profile[0].orientation)) {
				b = 1;
				if (profile[0].gender === 'man') {
					search = "(SELECT * FROM profiles\n\
						WHERE orientation LIKE '%Heterosexual%'\n\
						AND gender = 'woman'\n\
						AND pictures >= 10)";
				} else {
					search = "(SELECT * FROM profiles\n\
						WHERE orientation LIKE '%Heterosexual%'\n\
						AND gender = 'man'\n\
						AND pictures >= 10)";
				}
			}
			if (/Homosexual/.test(profile[0].orientation))
			{
				b = 1;
				if (search !== '')
					search += " UNION "
				if (profile[0].gender === 'man') {
					search += "(SELECT * FROM profiles\n\
						WHERE orientation LIKE '%Homosexual%'\n\
						AND gender = 'man'\n\
						AND pictures >= 10)";
				}
				else {
					search += "(SELECT * FROM profiles\n\
						WHERE orientation LIKE '%Homosexual%'\n\
						AND gender = 'woman'\n\
						AND pictures >= 10)";
				}
			}
			if (/Bisexual/.test(profile[0].orientation))
			{
				b = 1;
				if (search !== '')
					search += " UNION "
				search += "(SELECT * FROM profiles\n\
					WHERE orientation LIKE '%Bisexual%'\n\
					AND (gender = 'man' OR gender = 'woman')\n\
					AND pictures >= 10)";
			}
			search = "SELECT * FROM (" + search;
			search += ") as res WHERE res.id_usr\n\
				NOT IN (SELECT id_liked FROM likes WHERE id_usr = ?\n\
				UNION SELECT id_disliked FROM dislikes WHERE id_usr = ?\n\
				UNION SELECT id_favorited FROM favorites WHERE id_usr = ?) ORDER BY id_usr ASC;";
			if (b == 1) {
				return conn.query(search, [req.session.user.id, req.session.user.id, req.session.user.id]);
			} else
				throw "non recognized orientation:" + profile[0].orientation;
		}).then((row) => {
			if (row.length === 0) {
				conn.end();
				return res.render('swipe', {
					popupTitle: 'Swipe',
					popupMsg: 'We\'ve found no one, you are unique !',
					popup: true
				});
			}
			conn.end();
			return res.render('swipe', {
				nb_usr: row.length,
				users: row
			});
		})
		.catch(err => {
			console.log(err);
			conn.end(res.redirect("/"));
		});
	}).catch(err => {
		//not connected
	});
	} else {
		return res.redirect('/');
	}
});

router.post('/like', function(req, res) {
		if (req.session.connect) {
				let id = req.body.id;
				let username = req.body.username;
				mod.pool.getConnection(
				).then(conn => {
						conn.query("USE matcha")
						.then(() => {
							return conn.query("INSERT INTO likes(id_usr, id_liked) VALUES(?, ?)", [req.session.user.id, id]);
						}).then((row) => {
							return conn.query("SELECT COUNT(*) as `count` FROM likes WHERE id_usr = ? AND id_liked = ?", [id, req.session.user.id])
						}).then((row) => {
								conn.end();
								if (row[0].count === 1) {

									conn.query("INSERT INTO matchat(`id_usr1`, `id_usr2`, `key`) VALUES(?, ?, ?)", [req.session.user.id, id, uniqid()]);
									conn.query("INSERT INTO notifications(`id_usr`, `id`, `username`, `link`, `msg`, `title`) VALUES(?, ?, ?, ?, ?, ?)", [id, req.session.user.id, req.session.user.username, "/matchat/" + req.session.user.id, "You just matched !", "Match with: "]);
									conn.query("INSERT INTO notifications(`id_usr`, `id`, `username`, `link`, `msg`, `title`) VALUES(?, ?, ?, ?, ?, ?)", [req.session.user.id, id, username, "/matchat/" + id, "You just matched !", "Match with: "]);
									res.send('match');
								} else {
									
									conn.query("INSERT INTO notifications(`id_usr`, `id`, `username`, `link`, `msg`, `title`) VALUES(?, ?, ?, ?, ?, ?)", [id, req.session.user.id, req.session.user.username, "/profile?id=" + req.session.user.id, "This user liked you", "Like from: "]);
									res.send('liked');
								}
						}).catch(err => {
							console.log(err);
							res.send(false);
						});
				}).catch(err => {
					console.log(err);
					res.send(false);
				});
		} else {
			return res.redirect('/login');
		}
});

router.post('/dislike', function(req, res) {
	if (req.session.connect) {
		let id = req.body.id;
		mod.pool.getConnection()
		.then(conn => {
			conn.query("USE matcha")
				.then(() => {
					conn.query("INSERT INTO dislikes(id_usr, id_disliked) VALUES(?, ?)", [req.session.user.id, id]);
					conn.end();
					return true;
				}).catch(err => {
					console.log(err);
					res.send(false);
				});
		}).catch(err => {
			console.log(err);
			res.send(false);
		});
		res.send(true);
	} else {
		return res.redirect('/login');
	}
});

router.post('/fav', function(req, res) {
	if (req.session.connect) {
		let id = req.body.id;
		mod.pool.getConnection()
		.then(conn => {
			conn.query("USE matcha")
				.then(() => {
					conn.query("INSERT INTO favorites(id_usr, id_favorited) VALUES(?, ?)", [req.session.user.id, id]);
					conn.end();
					return true;
				}).catch(err => {
					console.log(err);
					res.send(false);
				});
		}).catch(err => {
			console.log(err);
			res.send(false);
		});
		res.send(true);
	} else {
		return res.redirect('/login');
	}
});

module.exports = router;
