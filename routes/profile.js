const express = require('express');
const router = express.Router();
const session = require('express-session');
const crypto = require('crypto-js');
const fs = require('fs');
const mod = require('./mod');
let	  today = new Date();

router.get('/', function(req, res) {
	if (req.session.connect) {
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
				if (rows[0]) {					
					conn.query("DELETE FROM notifications WHERE id_usr=? AND (link = ? OR (id = ? AND msg = ?));",
					[req.session.user.id, "/profile?id=" + id, id, "You just matched !"]);
					for (let index = 0; index < req.session.notif.length; index++) {
						const element = req.session.notif[index];
						if (element.link == "/profile?id=" + id || (element.id == id && element.msg == "You just matched !")) {
							req.session.notif.splice(index, 1);
						}
					}
					conn.end();
					return res.render('profile', {
						firstname: rows[0].firstname,
						lastname: rows[0].lastname,
						username: rows[0].username,
						id: rows[0].id_usr,
						age: rows[0].age,
						orientation: rows[0].orientation.substring(0, rows[0].orientation.length - 2),
						gender: rows[0].gender.charAt(0).toUpperCase() + rows[0].gender.slice(1),
						bio: rows[0].bio,
						pic: rows[0].pictures,
						tags: rows[0].tags
					});
				} else {
					conn.end();
					return res.render('profile', {
						popup: true,
						popupMsg: "This user did not create a profile",
						popupTitle: 'Informations missing'
					});
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
	
	router.post('/submit-create', function(req, res) {
		var name           = req.body.staticName;
		var username       = req.body.staticUsername;
		var gender         = req.body.gender;
		var bio            = req.body.bio;
		var photo          = req.body.photo;
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

	var choice = {
		Heterosexual         : req.body.heterosexual,
		Homosexual           : req.body.homosexual,
		Bisexual             : req.body.bisexual,
		Asexual              : req.body.asexual,
		Pansexual            : req.body.pansexual,
		Questioning          : req.body.questioning,
		Other                : req.body.other
	}

	var orientation = '';

	for (var property in choice) {
		if (choice[property] == 'on') {
			orientation = orientation + property + ", ";
		}
	}

	if (orientation == '') {
		orientation = 'bisexual';
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
						if (tags) {
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
						let age = mod.dateDiff(birthday, today);
						conn.query("INSERT INTO profiles(id_usr, firstname, lastname, username, gender, age, bio, orientation, pictures, tags) VALUES(?, ?, ?, ?, ?, ?, ?, ?, 0, ?)", [req.session.user.id, req.session.user.firstname, req.session.user.lastname, req.session.user.username, gender, age, bio, orientation, tags]);
						conn.end();
						res.redirect("/");
					});
				});
		}
});

router.post('/modify', function(req, res) {
	var lname          = req.body.lname;
	var fname          = req.body.fname;
	var uname          = req.body.uname;
	var bio            = req.body.bio;
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

	var choice = {
	  Heterosexual         : req.body.heterosexual,
	  Homosexual           : req.body.homosexual,
	  Bisexual             : req.body.bisexual,
	  Asexual              : req.body.asexual,
	  Pansexual            : req.body.pansexual,
	  Questioning          : req.body.questioning,
	  Other                : req.body.other
	}
  
	var orientation = '';
  
	for (var property in choice) {
	  if (choice[property] == 'on') {
		orientation = orientation + property + ", ";
	  }
	}
  
	if (orientation == '') {
			orientation = 'bisexual';
	}
  
	if (fname == "") {
	  fname = req.session.user.firstname;
	}
	if (lname == "") {
	  lname = req.session.user.lastname;
	}
	if (uname == "") {
	  uname = req.session.user.lastname;
	}
  
	else
	  if (req.session.connect) {
		mod.pool.getConnection()
		  .then((conn) => {
			conn.query("USE matcha;")
			.then(() => {
				if (tags) {
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
								}
								else {
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
				conn.query("UPDATE profiles SET lastname = ?, firstname = ?, username = ?, orientation = ?, bio = ?, tags = ? WHERE id_usr = ?", [lname, fname, uname, orientation, bio, tags, req.session.user.id]);
				req.session.user.firstname = fname;
				req.session.user.lastname = lname;
				req.session.user.username = uname;
				conn.end();
				return res.redirect("/");
				})
		  });
	  }
});

module.exports = router;
