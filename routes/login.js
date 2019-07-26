const express = require('express');
const router = express.Router();
const session = require('express-session');
const crypto = require('crypto-js');
const mod = require('./mod');
const formidable = require('formidable');
var today = new Date();

router.get('/', function (req, res) {
	if (req.session.connect) {
		return res.redirect('/');
	}
	else {
		return res.render('login', {
			
		});
	}
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
		.then((rows) => {
			return conn.query("SELECT * FROM users WHERE (username = ? OR email=?) AND pwd = ?", [login, login, pwd]);
		})
		.then((result) => {
			if (result[0] === undefined)
				throw "bad password or username";
			if (result[0].confirm === 1) {
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
				conn.query("SELECT COUNT(*) as nb FROM confirm WHERE id_usr = ?", result[0].id_usr)
				.then((rows) => {
					if (rows[0].nb === 0) {
						conn.end();
						return res.redirect('/profile/create-profile');
					} else {
						conn.end();
						return res.redirect('/?success=login');
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
			return false
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
