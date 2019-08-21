const express	= require('express');
const router	= express.Router();
const mod		= require('./mod');
const crypto	= require('crypto-js');
let id_usr;

router.get('/', function (req, res) {
	if (req.query.id_usr) {
		id_usr = req.query.id_usr;
	}
	if (req.query.confirmkey) {
		confirmkey = req.query.confirmkey;
	}
	if (req.session.connect) {
		id_usr = req.session.user.id;
	}

	if ((req.query.confirmkey !== undefined && req.query.id_usr !== undefined) || req.session.connect) {
		mod.pool.getConnection()
		.then(conn => {

		conn.query("USE matcha")
			.then(() => {
				if (req.query.confirmkey) {
					return conn.query("SELECT COUNT(*) as nb FROM confirm WHERE id_usr = ? AND confirmkey = ?", [id_usr, crypto.SHA512(confirmkey).toString()]);
				}
				else {
					return conn.query("SELECT COUNT(*) as nb FROM users where id_usr = ?", [req.session.user.id]);
				}
			})
			.then((row) => {
				if (row[0].nb === 1) {
					return conn.query("SELECT * FROM users WHERE id_usr = ?", [id_usr]);
				} else {
					conn.end();
					return res.render('index', {
						popupTitle: "Request",
						popupMsg: "Your request expired",
						popup: true
					});
				}
			})
			.then((result) => {
				conn.query("DELETE FROM confirm WHERE id_usr = ?", [id_usr]);
				conn.end();
				return res.render('change-password', {
				});
			})
		})
	} else {
		return res.render('index', {
			popupTitle: "Request",
			popupMsg: "Access denied",
			popup: true
		});
	}
});

router.post('/confirm', mod.sanitizeInputForXSS, function (req, res) {
	var pwd			= mod.sanitize(req.body.pwd);
	var pwdConf		= mod.sanitize(req.body.pwdConf);

	if (pwd === "" || pwdConf === "") {
		return res.render('change-password', {
			warning: "Please fill out all fields"
		});
	} else if (pwd !== pwdConf) {
		return res.render('change-password', {
			error: "Veuillez insérer des mots de passe identiques"
		});
	} else if (mod.checkpwd(pwd) === false) {
		return res.render('change-password', {
		  error: "Votre mot de passe doit contenir au munimum 8 lettres contenant une majuscule, une minuscule et un chiffre"
		});
	}
	pwdHash = crypto.SHA512(pwd).toString();
	mod.pool.getConnection()
	.then(conn => {
		conn.query("USE matcha")
		.then(() => {
			conn.query("UPDATE users SET pwd = ? WHERE id_usr = ?", [pwdHash, id_usr]);
			conn.end();
		})
		return res.render('login', {
			popupTitle: 'Password',
			popupMsg: 'Your password has been changed with success',
			popup: true
		});
	});
});

module.exports = router;
