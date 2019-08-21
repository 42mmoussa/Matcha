var express = require('express');
var router = express.Router();
const mod        = require('./mod');
const crypto     = require('crypto-js');
const nodemailer = require('nodemailer');

router.get('/', function (req, res, next) {
	if (req.session.connect) {
		mod.pool.getConnection()
		  .then((conn) => {
			conn.query("USE matcha;")
			.then(() => {
				return conn.query("SELECT * FROM profiles WHERE id_usr = ?", [req.session.user.id])
			})
			.then((rows) => {
				conn.end();
				if (rows.length === 0) {
					return res.redirect('/profile/create-profile');
				}
				return res.render('settings');
			})
		});
	}
	else {
		return res.render('login', {
			popupTitle: "Login",
			popupMsg: "Please login",
			popup: true
		})
	}
});

router.get('/confirm-password', function (req, res) {
	if (req.session.connect) {
		return res.render('confirm-password', {
		});
	}
	else {
		return res.render('login', {
			popupTitle: "Login",
			popupMsg: "Please login",
			popup: true
		})
	}
});

router.get('/change-gender', function (req, res) {
	if (req.session.connect) {
		return res.render('change-gender', {
		});
	}
	else {
		return res.render('login', {
			popupTitle: "Login",
			popupMsg: "Please login",
			popup: true
		})
	}
});

router.post('/delete', function(req, res) {
	if (req.session.connect) {
		mod.pool.getConnection()
		  .then((conn) => {
			conn.query("USE matcha;")
			.then(() => {
				return conn.query("SELECT * FROM users WHERE id_usr = ? AND pwd = ?", [req.session.user.id, crypto.SHA512(req.body.pwd.trim()).toString()])
			})
			.then((rows) => {
				if (rows[0]) {
					conn.query("DELETE FROM messages WHERE key LIKE (SELECT key FROM matchat WHERE id_usr1 = ? OR id_usr2 = ?)", [req.session.user.id, req.session.user.id]);
					conn.query("DELETE FROM matchat WHERE id_usr1 = ? OR id_usr2 = ?", [req.session.user.id, req.session.user.id]);
					conn.query("DELETE FROM users WHERE id_usr = ?", [req.session.user.id])
					.then(() => {
						req.session.destroy();
						conn.end();
						return res.render('login', {
							popupTitle: "Account Deleted",
							popupMsg: "Your account has been deleted with success",
							popup: true
						});
					})
				}
				else {
					conn.end();
					return res.render('confirm-password', {
						popupTitle: "Wrong Password",
						popupMsg: "Wrong Password",
						popup: true
					});
				}
			})
			.catch(err => {
				console.log(err);
				conn.end();
			});
		});
	}
	else {
		return res.render('login', {
			popupTitle: "Login",
			popupMsg: "Please login",
			popup: true
		});
	}
});

router.post('/change-gender/confirm', function(req, res) {
	if ((req.body.gender != "man" && req.body.gender != "woman") || req.body.gender == undefined) {
		return res.render('change-gender', {
			warning: "Veuillez rentrer un genre valide"
		});
	}
	if (req.session.connect) {
		mod.pool.getConnection()
		.then((conn) => {
			conn.query("USE matcha")
			.then(() => {
				return conn.query("SELECT * FROM profiles WHERE id_usr = ?", [req.session.user.id]);
			})
			.then(rows => {
				if (rows[0]) {
					if (rows[0].gender != req.body.gender) {
						conn.query("DELETE FROM likes WHERE id_liked = ?", [req.session.user.id]);
						conn.query("DELETE FROM likes WHERE id_usr = ?", [req.session.user.id]);
						conn.query("DELETE FROM dislikes WHERE id_disliked = ?", [req.session.user.id]);
						conn.query("DELETE FROM dislikes WHERE id_usr = ?", [req.session.user.id]);
						conn.query("DELETE FROM messages WHERE id_usr = ?", [req.session.user.id]);
						conn.query("DELETE FROM messages WHERE key LIKE (SELECT key FROM matchat where id_usr1 = ? OR id_usr2 = ?)", [req.session.user.id, req.session.user.id]);
						conn.query("DELETE FROM favorites WHERE id_usr = ?", [req.session.user.id]);
						conn.query("DELETE FROM favorites WHERE id_favorited = ?", [req.session.user.id]);
						conn.query("DELETE FROM matchat WHERE id_usr1 = ?", [req.session.user.id]);
						conn.query("DELETE FROM matchat WHERE id_usr2 = ?", [req.session.user.id]);
						conn.query("UPDATE profiles SET gender = ? WHERE id_usr = ?", [req.body.gender, req.session.user.id]);
						conn.end();
						return res.render('settings', {
							popupTitle: "Gender",
							popupMsg: "Your gender has been changed with success",
							popup: true
						});
					}
					else {
						conn.end();
						return res.render('settings');
					}
				}
				else {
					conn.end();
					return res.render('login', {
						popupTitle: "Login",
						popupMsg: "Please login",
						popup: true
					});
				}
			})
		})
	}
	else {
		return res.render('login', {
			popupTitle: "Login",
			popupMsg: "Please login",
			popup: true
		});
	}
});

router.get('/change-mail', function(req,res) {
	if (req.session.connect) {
		return res.render('change-mail', {
		});
	}
	else {
		return res.render('login', {
			popupTitle: "Login",
			popupMsg: "Please login",
			popup: true
		});
	}
})

router.post('/change-mail/confirm', function(req, res) {
	if (!req.session.connect) {
		return res.render('login', {
			popupTitle: "Login",
			popupMsg: "Please login",
			popup: true
		});
	}
	else {
		if (req.body.mail == req.session.user.email) {
			return res.render('settings', {
				popupTitle: "Email",
				popupMsg: "Your email has been changed",
				popup: true
			});
		}
		else {
			if (mod.checkemail(req.body.mail) === false) {
				return res.render('change-mail', {
					error: "Please insert a valide e-mail"
				});
			}
			else {
				mod.pool.getConnection()
				.then(conn => {
					conn.query("USE matcha")
					.then(() => {
						conn.query("SELECT * FROM users where id_usr = ?", [req.session.user.id])
						.then(rows => {
							conn.query("SELECT COUNT(*) as nb FROM users where email = ?", [req.body.mail])
							.then(result => {
								if (result[0].nb == 0) {
									conn.query("UPDATE users SET email = ? WHERE id_usr = ?", [req.body.mail, req.session.user.id]);
									req.session.user.email = req.body.mail;
									conn.end();
									var transporter = nodemailer.createTransport({
										service: 'gmail',
										auth: {
											user: 'matcha.mmoussa.atelli@gmail.com',
											pass: 'compteaminemohamad'
										}
									});

									var mailOptions = {
										from: 'matcha.mmoussa.atelli@gmail.com',
										to: rows[0].email,
										subject: 'Email changed',
										html: `<html>
										<body>
										<p>Your email has been changed, your new mail is `+ req.body.mail + `</p>
										</body>
										</html>`
									};

									transporter.sendMail(mailOptions, function(error, info){
										if (error) {
											console.log(error);
										} else {
											console.log('Email sent: ' + info.response);
										}
									});
									res.render('settings', {
										popupTitle: "Email",
										popupMsg: "Your email has been changed with success",
										popup: true
									});
								}
								else {
									conn.end();
									res.render('change-mail', {
										error: "This e-mail is already taken"
									});
								}
							})
						})
					})
				})
			}
		}
	}
});

router.get('/change-birthdate', function(req,res) {
	if (req.session.connect) {
		return res.render('change-birthdate', {
		});
	}
	else {
		return res.render('login', {
			popupTitle: "Login",
			popupMsg: "Please login",
			popup: true
		});
	}
})

router.post('/change-birthdate/confirm', function(req, res) {
	if (!req.session.connect) {
		return res.render('login', {
			popupTitle: "Login",
			popupMsg: "Please login",
			popup: true
		});
	}
	else {
		var birthday       = new Date(req.body.date.trim());
		var today          = new Date();

		if (mod.dateDiff(birthday, today) < 18 || mod.dateDiff(birthday, today) > 90) {
			return res.render('change-birthdate', {
				error: "You must have atleast 18 years old"
			});
		}
		else {
			mod.pool.getConnection()
			.then(conn => {
				conn.query("USE matcha")
				.then(() => {
					age = mod.dateDiff(birthday, today);
					conn.query("UPDATE users SET birthday = ? WHERE id_usr = ?", [birthday, req.session.user.id]);
					conn.query("UPDATE profiles SET birthday = ? WHERE id_usr = ?", [birthday, req.session.user.id]);
					req.session.user.age = age;
					conn.end();
					return res.render('settings', {
						popupTitle: "Birthdate",
						popupMsg: "Your birthdate has been changed with success",
						popup: true
					});
				})
			})
		}
	}
});

router.get('/blocked-users', function(req, res) {
	if (req.session.connect) {
		var blocked_users;
		mod.pool.getConnection()
		.then(conn => {
			conn.query("USE matcha;")
			.then(() => {
				conn.query("SELECT * from profiles where id_usr = ?", [req.session.user.id])
				.then(rows => {
					if (rows.length !== 0) {
						blocked_users = rows[0].blocked_user
						conn.end();
						blocked_users = blocked_users.split(',');
						for(var i = 0; i < blocked_users.length; i++) {
							if (blocked_users[i] == '') {
								blocked_users.splice(i, 1);
								i--;
							}
						}
						return res.render('blocked-users', {
							blocked_users: blocked_users
						});
					}
					else {
						conn.query("SELECT * FROM users WHERE id_usr = ?", req.session.user.id)
						.then((info) => {
							let birthday = new Date(info[0].birthday);
							conn.end();
							var today = new Date();
							return res.render('create-profile', {
								age: mod.dateDiff(birthday, today),
								popup: true,
								popupMsg: "Please create a profile",
								popup: "ERROR"
							});
						});
					}
				})
			})
		})
	}
	else {
		return res.render('login', {
			popupTitle: "Login",
			popupMsg: "Please login",
			popup: true
		});
	}
})

module.exports = router;
