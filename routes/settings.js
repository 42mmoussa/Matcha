var express = require('express');
var router = express.Router();
const mod        = require('./mod');
const crypto     = require('crypto-js');

router.get('/', function (req, res, next) {
	if (req.session.connect) {
		res.render('settings', {
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

router.get('/confirm-password/delete', function(req, res) {
	if (req.session.connect) {
		mod.pool.getConnection()
		  .then((conn) => {
			conn.query("USE matcha;")
			.then(() => {
				return conn.query("SELECT * FROM users WHERE id_usr = ? AND pwd = ?", [req.session.user.id, crypto.SHA512(req.body.pwd.trim()).toString()])
				.then(rows => {
					console.log(row[0].id_usr)
					if (rows[0].id_usr == req.session.user.id) {
						conn.query("DELETE FROM users WHERE id_usr = ?", req.session.user.id)
						.then(() => {
							req.session.user = undefined;
							req.session.connect = undefined;
							return res.render('index', {
								popupTitle: "Account Deleted",
								popupMsg: "Your account has been deleted with success",
								popup: true
							});
						})
					}
					else {
						return res.render('settings/confirm-password', {
							popupTitle: "Wrong Password",
							popup: "Wrong Password",
							popup: true
						});
					}
				})
			})
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

module.exports = router;
