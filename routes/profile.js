const express = require('express');
const router = express.Router();
const mod = require('./mod');
const keys = require('./keys');
var	  today = new Date();

router.get('/', function(req, res) {
	if (req.session.connect) {
		if (req.session.user.age < 18) {
			return res.redirect("/settings/change-birthdate");
		}
		id = req.query.id;
		if (id === undefined)
			id = req.session.user.id;
		mod.pool.getConnection()
		.then((conn) => {
			conn.query("USE matcha")
			.then(() => {
				return conn.query("SELECT * FROM profiles WHERE id_usr = ?", id)
			})
			.then((rows) => {
				if (rows.length == 1) {
					conn.query("SELECT * FROM likes WHERE id_usr = ? AND id_liked = ?", [req.session.user.id, id])
					.then(like => {
						let liked = like.length > 0 ? 'green' : 'red';
						conn.query("SELECT * FROM profiles WHERE id_usr = ?", [req.session.user.id])
						.then(user_block => {
							if (user_block[0].blocked_user != null) {
								blocked_user = user_block[0].blocked_user.split(',');
							}
							else {
								blocked_user = user_block[0].blocked_user;
							}
							conn.query("SELECT * FROM likes WHERE id_usr = ? AND id_liked = ?", [id, req.session.user.id])
							.then(love => {
								if (love.length > 0) {
									loved = "1";
									if (liked == "green") {
										loved = "2";
									}
								}
								else {
									loved = "0";
								}
								conn.end();
								return res.render('profile', {
									firstname: rows[0].firstname.charAt(0).toUpperCase() + rows[0].firstname.slice(1),
									lastname: rows[0].lastname.charAt(0).toUpperCase() + rows[0].lastname.slice(1),
									username: rows[0].username,
									id: rows[0].id_usr,
									age: mod.dateDiff(rows[0].birthday, today),
									orientation: rows[0].orientation.charAt(0).toUpperCase() + rows[0].orientation.slice(1),
									gender: rows[0].gender.charAt(0).toUpperCase() + rows[0].gender.slice(1),
									bio: rows[0].bio,
									pic: rows[0].pictures,
									tags: rows[0].tags,
									like: liked,
									pop: rows[0].pop,
									coords: {
										lat: rows[0].lat,
										lng: rows[0].lng
									},
									city: rows[0].city,
									key: keys.google.key,
									blocked_user: blocked_user,
									loved: loved
								});
							})
						})
					})
				} else {
					conn.end();
					if (id === req.session.user.id) {
						return res.redirect('/profile/create-profile');
					}
					return res.redirect("/profile");
				}
			})
			.catch(err => {
				console.log(err);
				conn.end();
			});
		})
	} else {
		res.redirect('/');
	}
});

router.get('/create-profile', function(req, res) {
	if (req.session.connect)
	{
		mod.pool.getConnection()
		.then((conn) => {
			conn.query("USE matcha")
			.then(() => {
				return conn.query("SELECT COUNT(*) as nb FROM profiles WHERE id_usr = ?", req.session.user.id)
			})
			.then((rows) => {
				if (rows[0].nb !== 0) {
					conn.end();
					return res.redirect('/');
				} else {
					conn.query("SELECT * FROM users WHERE id_usr = ?", req.session.user.id)
					.then((info) => {
						let birthday = new Date(info[0].birthday);
						conn.end();
						return res.render('create-profile', {
							age: mod.dateDiff(birthday, today)
						});
					});
				}
			});
		})
	} else {
		return res.redirect('/');
	}
});

router.post('/submit-create', mod.sanitizeInputForXSS, function(req, res) {
	var name           = mod.sanitize(req.body.staticName);
	var username       = mod.sanitize(req.body.staticUsername);
	var gender         = mod.sanitize(req.body.gender);
	var orientation    = mod.sanitize(req.body.orientation);
	var bio            = mod.sanitize(req.body.bio);
	var birthday       = new Date(req.session.user.birthday);
	tagexist = req.body.tags.split(',');
	for(var i = 0; i < tagexist.length - 1; i++) {
		for(var j = i + 1; j < tagexist.length; j++) {
			if (tagexist[i] == tagexist[j]) {
				tagexist.splice(i, 1);
				i--;
			}
		}
	}
	var tags = tagexist.join(',');
	tags += ',';

if (orientation != "Heterosexual" && orientation != "Homosexual") {
	orientation = 'Bisexual';
}
if ((gender != "man" && gender != "woman") || gender == undefined) {
	return res.render('create-profile', {
		warning: "Veuillez rentrer un genre valide",
		age: mod.dateDiff(birthday, today)
	});
}

if (name != (req.session.user.lastname + " " + req.session.user.firstname) || username != req.session.user.username || gender == undefined) {
	return res.render('create-profile', {
		warning: "Veuillez remplir toutes les cases",
		age: mod.dateDiff(birthday, today)
	});
}
else
	if (req.session.connect) {
		mod.pool.getConnection()
			.then((conn) => {
				conn.query("USE matcha;")
				.then(() => {
					if (tags != ',' && tags) {
						tagexist.forEach(function(element) {
							conn.query("SELECT COUNT(*) as nb from tags where name_tag = ?", [element])
							.then((rows) => {
								if (rows[0].nb === 0) {
									conn.query("INSERT INTO tags(name_tag, nb_tag) VALUES(?, 1)", [element]);
								}
								else {
									conn.query("UPDATE tags SET nb_tag = nb_tag + 1 WHERE name_tag = ?", [element]);
								}
							})
						});
					}
					conn.query("INSERT INTO profiles(id_usr, firstname, lastname, username, gender, birthday, bio, orientation, pictures, tags) VALUES(?, ?, ?, ?, ?, ?, ?, ?, 0, ?)", [req.session.user.id, req.session.user.firstname, req.session.user.lastname, req.session.user.username, gender, birthday, bio, orientation, tags]);
					conn.end();
					res.redirect("/");
				});
			});
	}
});

router.post('/modify', mod.sanitizeInputForXSS, function(req, res) {
	var lname          = mod.sanitize(req.body.lname);
	var fname          = mod.sanitize(req.body.fname);
	var uname          = mod.sanitize(req.body.uname);
	var bio            = mod.sanitize(req.body.bio);
	var city           = mod.sanitize(req.body.city);
	var orientation    = mod.sanitize(req.body.orientation);
	tagexist = req.body.tags.split(',');
	for(var i = 0; i < tagexist.length - 1; i++) {
		for(var j = i + 1; j < tagexist.length; j++) {
			if (tagexist[i] == tagexist[j]) {
				tagexist.splice(i, 1);
				i--;
			}
		}
	}
	var tags = tagexist.join(',');
	tags += ',';

	if (orientation != 'Heterosexual' && orientation != 'Homosexual') {
			orientation = 'Bisexual';
	}

	if (fname == "" || mod.checkname(fname) === false) {
	  fname = req.session.user.firstname;
	}
	if (lname == "" || mod.checkname(lname) === false) {
	  lname = req.session.user.lastname;
	}
	if (uname == "" || mod.checkuid(uname) === false) {
	  uname = req.session.user.username;
	}
	if (req.session.connect) {
		mod.pool.getConnection()
		  .then((conn) => {
			conn.query("USE matcha;")
			.then(() => {
				if (tags && tags != ',') {
					conn.query("SELECT tags FROM profiles WHERE id_usr = ?", [req.session.user.id])
					.then((resu) => {
						tagsUser = resu[0].tags.split(',');
						for(var i = 0; i < tagsUser.length; i++) {
							k = 0;
							for(var j = 0; j < tagexist.length; j++) {
								if (tagsUser[i] == tagexist[j]) {
									k = 1;
									break;
								}
							}
							if (k == 0)
								conn.query("UPDATE tags SET nb_tag = nb_tag - 1 WHERE name_tag = ?", [tagsUser[i]]);
						}
					})
					conn.query("SELECT tags FROM profiles WHERE id_usr = ?", [req.session.user.id])
					.then((result) => {
						tagexist.forEach(function(element) {
							conn.query("SELECT COUNT(*) as nb from tags where name_tag = ?", [element])
							.then((rows) => {
								if (rows[0].nb === 0) {
									conn.query("INSERT INTO tags(name_tag, nb_tag) VALUES(?, 1)", [element]);
								} else {
									tagsUser = result[0].tags.split(',');
									e = 0;
									for(var i = 0; i < tagsUser.length; i++) {
										if (tagsUser[i] == element) {
											e = 1;
										}
									}
									if (e === 0) {
										conn.query("UPDATE tags SET nb_tag = nb_tag + 1 WHERE name_tag = ?", [element])
									}
								}
							})
						})
					});
				}
				conn.query("SELECT COUNT(*) as nb FROM profiles WHERE username = ?", [uname])
				.then(rows => {
					if (rows[0].nb == 0) {
						conn.query("UPDATE profiles SET lastname = ?, firstname = ?, username = ?, orientation = ?, bio = ?, tags = ?, city = ? WHERE id_usr = ?",
						[lname, fname, uname, orientation, bio, tags, city, req.session.user.id]);
						req.session.user.firstname = fname;
						req.session.user.lastname = lname;
						req.session.user.username = uname;
						conn.end();
						return res.redirect("/");
					}
					else {
						conn.query("SELECT * from profiles WHERE username = ?", [uname])
						.then(result => {
							if (result[0].id_usr == req.session.user.id) {
								conn.query("UPDATE profiles SET lastname = ?, firstname = ?, username = ?, orientation = ?, bio = ?, tags = ?, city = ? WHERE id_usr = ?",
								[lname, fname, uname, orientation, bio, tags, city, req.session.user.id]);
								req.session.user.firstname = fname;
								req.session.user.lastname = lname;
								req.session.user.username = uname;
								conn.end();
								return res.redirect("/profile");
							}
							else {
								conn.end();
								return res.render("index", {
									popupTitle: "Profile",
									popupMsg: "Username already taken",
									popup: true
								});
							}
						})
					}
				})
			})
		});
	}
});

router.post('/block_user', mod.sanitizeInputForXSS, function(req, res) {
	var id_blocked = mod.sanitize(req.query.id);

	if (id_blocked == req.session.user.id) {
		res.render('settings', {
			popup: true,
			popupTitle: 'Error',
			popupMsg: "You can't block yourself !!!!"
		});
	}
	else {
		mod.pool.getConnection()
		.then((conn) => {
			conn.query("USE matcha;")
			.then(() => {
				return conn.query("SELECT * FROM profiles WHERE id_usr = ?", [req.session.user.id])
				.then(rows => {
					user_blocked = rows[0].blocked_user;
					if (user_blocked != null) {
						user_blocked = user_blocked.split(',')
						for (var i = 0; i < user_blocked.length; i++) {
							if (user_blocked[i] == id_blocked) {
								conn.end();
								res.render("settings", {
									popup: true,
									popupTitle: "ERROR",
									popupMsg: "This user was already blocked"
								});
							}
						}
						user_blocked = user_blocked.join(',');
						user_blocked = user_blocked + id_blocked + ',';
					}
					else
						user_blocked = id_blocked + ',';
					conn.query("UPDATE profiles SET blocked_user = ? WHERE id_usr = ?", [user_blocked, req.session.user.id]);
					conn.query("DELETE FROM messages WHERE key LIKE (SELECT key FROM matchat WHERE (id_usr1 = ? AND id_usr2 = ?) OR (id_usr1 = ? AND id_usr2 = ?)", [req.session.user.id, id_blocked, id_blocked, req.session.user.id]);
					conn.query("DELETE FROM matchat WHERE (id_usr1 = ? AND id_usr2 = ?) OR (id_usr1 = ? AND id_usr2 = ?)", [req.session.user.id, id_blocked, id_blocked, req.session.user.id]);
					conn.query("DELETE FROM likes WHERE id_liked = ? AND id_usr = ?", [req.session.user.id, id_blocked]);
					conn.query("DELETE FROM likes WHERE id_liked = ? AND id_usr = ?", [id_blocked, req.session.user.id]);
					conn.query("DELETE FROM dislikes WHERE id_disliked AND id_usr = ?", [req.session.user.id, id_blocked]);
					conn.query("DELETE FROM dislikes WHERE id_disliked = ? AND id_usr = ?", [id_blocked, req.session.user.id]);
					conn.query("DELETE FROM favorites WHERE id_usr = ? AND id_favorited", [req.session.user.id, id_blocked]);
					conn.query("DELETE FROM favorites WHERE id_usr = ? AND id_favorited", [id_blocked, req.session.user.id]);
					conn.end();
					res.render("settings", {
						popup: true,
						popupTitle: "Success",
						popupMsg: "This user has been blocked with success"
					});
				})
			})
		});
	}
});

module.exports = router;
