const express			= require('express');
const router			= express.Router();
const crypto			= require('crypto-js');
const mod				= require('./mod');
var today				= new Date();
const passport			= require('passport');
const passportSetup		= require('./oauth');

router.get('/', function (req, res) {
	if (req.session.connect) {
		return res.redirect('/');
	}
	else {
		return res.render('login', {

		});
	}
});

router.get('/google', passport.authenticate('google', {
	scope: [
		'profile',
		'email'
	]
}));

router.get('/google/redirect', passport.authenticate('google'), function (req, res) {
	let anniversaire = new Date(req.user.birthday);
	req.session.user = {
		id: req.user.id_usr,
		email: req.user.email,
		firstname: req.user.firstname,
		lastname: req.user.lastname,
		username: req.user.username,
		birthday: req.user.birthday,
		age: mod.dateDiff(anniversaire, today)
	};
	req.session.connect = true;

	mod.pool.getConnection()
	.then(conn => {
		conn.query("USE matcha")
			.then(() => {
				return conn.query("SELECT * FROM users WHERE id_usr = ?", [req.session.user.id]);
			})
			.then((row) => {
				if (row.length > 0 && row[0].googleID === null) {
					conn.query("UPDATE users SET googleID = ? WHERE id_usr = ?", [req.user.googleID, req.session.user.id]);
				}
				return conn.query("SELECT * FROM profiles WHERE id_usr = ?", [req.session.user.id]);
			})
			.then(row => {
				conn.end();
				req.session.notif = 0;
				if (row.length === 0)
					return res.redirect("/profile/create-profile");
				req.session.notif = row[0].read;
				return res.redirect('/profile');
			})
			.catch(err => {
				console.log(err);
				conn.end();
			});
	})
	.catch(err => {
		conn.end();
		console.log(err);
	})
});

router.post('/login_validation', function(req, res) {
	var login		= req.body.uname.trim();
	var pwd			= crypto.SHA512(req.body.pwd).toString();

	if (login === "" || pwd === "") {
		return res.render('login', {
			warning: "Please fill out all required fields"
		});
	}

	mod.pool.getConnection()
	.then(conn => {
	conn.query("USE matcha")
		.then(() => {
			return conn.query("SELECT * FROM users WHERE (username = ? OR email=?) AND pwd = ?", [login, login, pwd]);
		})
		.then((result) => {
			if (result[0] === undefined)
				throw "bad password or username";
			if (result[0].confirm === 1) {
				firstConnection = false;
				conn.query("SELECT `read` FROM profiles WHERE id_usr = ?", result[0].id_usr)
				.then((read) => {
					let anniversaire = new Date(result[0].birthday);
					req.session.user = {
						id: result[0].id_usr,
						email: result[0].email,
						firstname: result[0].firstname,
						lastname: result[0].lastname,
						username: result[0].username,
						birthday: result[0].birthday,
						age: mod.dateDiff(anniversaire, today)
					};
					req.session.connect = true;
					req.session.notif = 1;
					if (read.length > 0) {
						req.session.notif = read[0].read;
					}
					return (conn.query("SELECT COUNT(*) as nb FROM confirm WHERE id_usr = ?", result[0].id_usr));
				})
				.then(rows => {
					conn.end();
					if (rows[0].nb === 0) {
						return res.redirect('/profile/create-profile');
					} else {
						return res.redirect('/');
					}
				});
			} else {
				conn.end();
				return res.render('login', {
					error: "Account not confirmed"
				});
			}
			conn.end();
		})
		.catch(err => {
			console.log(err);
			conn.end();
			return res.render('login', {
				error: "Bad password or username"
			});
		})
	}).catch(err => {
		conn.end();
	});
});

router.get('/confirm-acc', function (req, res) {
	newKey = mod.randomString(50, '0123456789abcdefABCDEF');
	if (req.query.id_usr !== "") {
		id_usr = req.query.id_usr;
	}
	if (req.query.confirmkey !== "") {
		confirmkey = req.query.confirmkey;
	}
	if (req.query.confirmkey !== "" && req.query.id_usr !== "") {
		mod.pool.getConnection()
		.then(conn => {

	conn.query("USE matcha")
		.then(() => {
		return conn.query("SELECT COUNT(*) as nb FROM confirm WHERE id_usr = ? AND confirmkey = ?", [id_usr, crypto.SHA512(confirmkey).toString()]);
		})
		.then((row) => {
		console.log(row[0]);
		if (row[0].nb === 1) {
			return conn.query("SELECT * FROM users WHERE id_usr = ?", [id_usr]);
		} else {
			conn.end();
			return res.render('login', {
			popupTitle: "Request",
			popupMsg: "Your request expired",
			popup: true
			});
		}
		})
		.then((result) => {
		if (result) {
			if (result[0].id_usr == id_usr) {
				if (result[0].confirm == 1) {
					conn.end();
					return res.render('index', {
					popupTitle: "Account",
					popupMsg: "Your account is already confirmed",
					popup: true
					});
				} else {
					conn.query("UPDATE users SET confirm = 1 WHERE id_usr = ?", [id_usr]);
					conn.query("DELETE FROM confirm WHERE id_usr = ?", [id_usr]);
					conn.end();
					return res.render('login', {
					popupTitle: "Account",
					popupMsg: "Your account has been confirmed",
					popup: true
					});
				}
			}
		}
		})
		.catch(err => {
		console.log(err);
		conn.end();
		return res.render('index', {
			popupTitle: "Request",
			popupMsg: "Your request expired",
			popup: true
		});
		})

	}).catch(err => {
	conn.end();
	res.render('index', {
		popupTitle: "Request",
		popupMsg: "Your request expired",
		popup: true
	});
	});
}
});


module.exports = router;
