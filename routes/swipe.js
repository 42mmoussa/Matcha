const express = require('express');
const router = express.Router();
const mod = require('./mod');
const uniqid = require('uniqid');

router.get('/', mod.sanitizeInputForXSS, function(req, res) {
	if (req.session.connect) {
		if (req.session.user.age < 18) {
			return res.redirect("/settings/change-birthdate");
		}
		mod.pool.getConnection()
		.then(conn => {
			conn.query("USE matcha")
			.then(() => {
				return conn.query("SELECT * FROM profiles WHERE id_usr=?", [req.session.user.id]);
			})
			.then((profile) => {
				if (profile.length === 0) {
					conn.end();
					return res.redirect("/profile/create-profile");
				} else if (profile[0].pictures == 0) {
					throw "needpic";
				}
				let b = 0;

				let distCalc = "111.111 *"+
							"DEGREES(ACOS(LEAST(COS(RADIANS(lat))"+
							" * COS(RADIANS(?))"+
							" * COS(RADIANS(lng - ?))"+
							" + SIN(RADIANS(lat))"+
							" * SIN(RADIANS(?)), 1.0)))";

				let search = "SELECT * FROM (SELECT id_usr, firstname, lastname, username, gender, birthday, orientation, pictures, tags, lat, lng, bio, "+
							distCalc + " As Dist"+
							" FROM profiles) as res" +
							" WHERE res.id_usr != ? AND res.pictures > 0 AND res.id_usr"+
							" NOT IN (SELECT id_liked FROM likes WHERE id_usr = ?"+
							" UNION SELECT id_disliked FROM dislikes WHERE id_usr = ?"+
							" UNION SELECT id_favorited FROM favorites WHERE id_usr = ?)"+
							" AND (";
				let searchData = [];
				let searchCol = [];

				if (/Heterosexual/.test(profile[0].orientation)) {
					search += " (res.orientation LIKE ?"+
					" AND res.gender = ?)";
					if (profile[0].gender === 'man') {
						searchData.push("%Heterosexual%");
						searchData.push("woman");
						searchCol.push("heterosexual");
					} else {
						searchData.push("%Heterosexual%");
						searchData.push("man");
						searchCol.push("heterosexual");
					}
				}
				else if (/Homosexual/.test(profile[0].orientation))
				{
					search += " (res.orientation LIKE ?"+
					" AND res.gender = ?)";
					if (profile[0].gender === 'man') {
						searchData.push("%Homosexual%");
						searchData.push("man");
						searchCol.push("homosexual");
					}
					else {
						searchData.push("%Homosexual%");
						searchData.push("woman");
						searchCol.push("homosexual");
					}
				}
				else if (/Bisexual/.test(profile[0].orientation))
				{
					search += " (res.orientation LIKE ?"+
						" AND (res.gender = ? OR res.gender = ?))";
					searchData.push("%Bisexual%");
					searchData.push("woman");
					searchData.push("man");
					searchCol.push("homosexual");
				}

				search += ")";

				if (profile[0].blocked_user != null) {
					blockedUsers = profile[0].blocked_user.split(',');
					blockedUsers.pop();
					blockedUsers.forEach(function(element) {
						search += " AND (res.id_usr != ?)";
						searchData.push(element);
						searchCol.push("BlockedUser");
					});
				}

			let first = 0;
			if (searchCol.length > 0) {
				searchCol.forEach(function (element) {
					if (first === 0) {
						if (element === 'heterosexual' || element === 'homosexual') {
							search += " ORDER BY ( IF (res.orientation LIKE ? AND res.gender = ? , 1000, 0)";
							searchData.push(searchData[first]);
							first++;
							searchData.push(searchData[first]);
						} else if (element === 'bisexual') {
							search += " ORDER BY ( IF (res.orientation LIKE ? AND (res.gender = ? OR res.gender = ?) , 1000, 0)";
							searchData.push(searchData[first]);
							first++;
							searchData.push(searchData[first]);
							first++;
							searchData.push(searchData[first]);
						}
					} else {
						if (element === 'heterosexual' || element === 'homosexual') {
							search += "+ IF (res.orientation LIKE ? AND res.gender = ? , 1000, 0)";
							searchData.push(searchData[first]);
							first++;
							searchData.push(searchData[first]);
						} else if (element === 'bisexual') {
							search += " + IF (res.orientation LIKE ? AND (res.gender = ? OR gender = ?) , 1000, 0)";
							searchData.push(searchData[first]);
							first++;
							searchData.push(searchData[first]);
							first++;
							searchData.push(searchData[first]);
						}
					}
					first++;
				});
				search += " + IF (res.Dist < 1 , 400, 0)"+
						" + IF (res.Dist < 5 , 200, 0)"+
						" + IF (res.Dist < 7 , 100, 0)"+
						" + IF (res.Dist < 10 , 25, 0)"+
						") DESC;";
			}
			searchData.unshift(profile[0].lat, profile[0].lng, profile[0].lat, profile[0].id_usr, profile[0].id_usr, profile[0].id_usr, profile[0].id_usr);
			return conn.query(search, searchData);
			})
			.then((row) => {
				if (row.length === 0) {
					conn.end();
					return res.render('settings', {
						nb_usr: 0,
						users: null,
						popupTitle: 'Swipe',
						popupMsg: 'We\'ve found no one, you are unique !',
						popup: true
					});
				}
				let i = -1;
				let today = new Date();
				while (++i < row.length) {
					let bday = new Date(row[i].birthday);
					row[i].age = mod.dateDiff(bday, today);
					if (row[i].tags != null) {
						row[i].tags = row[i].tags.replace(/,/g, ' ');
					}
				}
				conn.end();
				return res.render('swipe', {
					nb_usr: row.length,
					users: row
				});
			})
			.catch(err => {
				console.log(err);
				conn.end();
				if (err = "needpic") {
					return res.redirect("/change-picture?error=needpic");
				}
				return res.redirect("/");
			});
		})
		.catch(err => {
			//not connected
		});
	} else {
		return res.redirect('/');
	}
});

router.post('/like', mod.sanitizeInputForXSS, function(req, res) {
		if (req.session.connect) {
				let id = mod.sanitize(req.body.id);
				let username = mod.sanitize(req.body.username);
				if (id == req.session.user.id) {
						return res.send(false);
				}
				mod.pool.getConnection()
				.then(conn => {
						conn.query("USE matcha")
						.then(() => {
							return conn.query("SELECT * FROM profiles WHERE id_usr = ?", [id]);
						})
						.then((row) => {
							if (row[0].blocked_user != null) {
								let blockedUsers = row[0].blocked_user.split(',');
								blockedUsers.pop();
								if (blockedUsers.includes(req.session.user.id.toString())) {
									throw "You can't like this user";
								}
							}
							if (row[0].pictures == 0) {
								throw "You can't like this user";
							}
							return conn.query("SELECT * FROM profiles WHERE id_usr = ?", [req.session.user.id]);
						})
						.then((row) => {
							if (row[0].pictures == 0) {
								throw 'needpic';
							}
							conn.query("DELETE FROM dislikes WHERE id_usr = ? AND id_disliked = ?", [req.session.user.id, id]);
							conn.query("UPDATE profiles SET pop = pop + (20 / (1 + POW(10, (pop - ?) /20))) where id_usr = ?", [row[0].pop, id]);
							return conn.query("INSERT INTO likes(id_usr, id_liked) VALUES(?, ?)", [req.session.user.id, id]);
						})
						.then((row) => {
							return conn.query("SELECT COUNT(*) as `count` FROM likes WHERE id_usr = ? AND id_liked = ?", [id, req.session.user.id])
						})
						.then((row) => {
								if (row[0].count > 0) {
									conn.query("INSERT INTO matchat(`id_usr1`, `id_usr2`, `key`) VALUES(?, ?, ?)", [req.session.user.id, id, uniqid()]);
									conn.query("INSERT INTO notifications(`id_usr`, `id`, `username`, `link`, `msg`, `title`) VALUES(?, ?, ?, ?, ?, ?)", [id, req.session.user.id, req.session.user.username, "/matchat/" + req.session.user.id, "You just matched !", "Match with: "]);
									conn.query("INSERT INTO notifications(`id_usr`, `id`, `username`, `link`, `msg`, `title`) VALUES(?, ?, ?, ?, ?, ?)", [req.session.user.id, id, username, "/matchat/" + id, "You just matched !", "Match with: "]);
									conn.end();
									res.send('match');
								} else {
									conn.query("INSERT INTO notifications(`id_usr`, `id`, `username`, `link`, `msg`, `title`) VALUES(?, ?, ?, ?, ?, ?)", [id, req.session.user.id, req.session.user.username, "/profile?id=" + req.session.user.id, "This user liked you", "Like from: "]);
									conn.end();
									res.send('liked');
								}
						}).catch(err => {
							console.log(err);
							conn.end();
							res.send(err);
						});
				})
				.catch(err => {
					console.log(err);
					res.send(false);
				});
		} else {
			return res.redirect('/login');
		}
});

router.post('/dislike', mod.sanitizeInputForXSS, function(req, res) {
	if (req.session.connect) {
		let id = mod.sanitize(req.body.id);
		var wasHeMatching = true;
		mod.pool.getConnection()
		.then(conn => {
			conn.query("USE matcha")
			.then(() => {
				return conn.query("SELECT * FROM matchat WHERE (id_usr1 = ? AND id_usr2 = ?) OR (id_usr1 = ? AND id_usr2 = ?)", [req.session.user.id, id, id, req.session.user.id]);
			})
			.then((row) => {
				if (row.length > 0) {
					wasHeMatching = "stopedMatch";
				}
				return conn.query("SELECT * FROM profiles WHERE id_usr = ?", [req.session.user.id]);
			})
			.then((row) => {
				conn.query("DELETE FROM likes WHERE id_usr = ? AND id_liked = ?", [req.session.user.id, id]);
				conn.query("DELETE FROM matchat WHERE (id_usr1 = ? AND id_usr2 = ?) OR (id_usr1 = ? AND id_usr2 = ?)", [req.session.user.id, id, id, req.session.user.id]);
				conn.query("UPDATE profiles SET pop = GREATEST(pop - (20 / (1 + POW(10, (? - pop) /20))), 0) where id_usr = ?", [row[0].pop, id]);
				conn.query("INSERT INTO dislikes(id_usr, id_disliked) VALUES(?, ?)", [req.session.user.id, id]);
				conn.end();
				return res.send(wasHeMatching);
			}).catch(err => {
				console.log(err);
				conn.end();
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

router.post('/fav', mod.sanitizeInputForXSS, function(req, res) {
	if (req.session.connect) {
		let id = mod.sanitize(req.body.id);
		mod.pool.getConnection()
		.then(conn => {
			conn.query("USE matcha")
				.then(() => {
					conn.query("INSERT INTO favorites(id_usr, id_favorited) VALUES(?, ?)", [req.session.user.id, id]);
					conn.end();
					return true;
				}).catch(err => {
					console.log(err);
					conn.end();
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
