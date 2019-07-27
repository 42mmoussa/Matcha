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
				firstConnection = false;
				conn.query("SELECT COUNT(*) as nb FROM confirm WHERE id_usr = ?", result[0].id_usr)
				.then((rows) => {
					if (rows.nb === 0)
						req.session.firstConnection = true;
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
					return (conn.query("SELECT * FROM notifications WHERE id_usr = ?", [req.session.user.id]));		
				}).then(row2 => {
					i = -1;
					req.session.notif = [];
					while (++i < row2.length) {					
						req.session.notif.push(row2[i]);
					}
					if (req.session.firstConnection) {
						conn.end();
						return res.redirect('/profile/create-profile');
					} else {
						conn.end();
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


module.exports = router;
