const express    = require('express');
const router     = express.Router();
const mod        = require('./mod');
const crypto     = require('crypto-js');
const nodemailer = require('nodemailer');

router.get('/', function (req, res) {
	return res.render('signup', {
	});
});

router.post('/signup_validation', mod.sanitizeInputForXSS, function (req, res) {

	var lastname       = mod.sanitize(req.body.lname.trim());
	var firstname      = mod.sanitize(req.body.fname.trim());
	var username       = mod.sanitize(req.body.uname.trim());
	var pwd            = mod.sanitize(req.body.pwd.trim());
	var pwdConf        = mod.sanitize(req.body.confpwd.trim());
	var email          = mod.sanitize(req.body.email.trim());
	var birthday       = new Date(mod.sanitize(req.body.date.trim()));
	var today          = new Date();
	var confirm        = 0;
	var confirmKey     = mod.randomString(50, '0123456789abcdefABCDEF');

	if (lastname === "" || firstname === "" || username === "" || pwd  === "" || pwdConf === "" || email === "") {
		return res.render('signup', {
			warning: "Veuillez remplir toutes les cases"
		});
	}  else if (mod.checkname(lastname) === false || mod.checkname(firstname) === false) {
		return res.render('signup', {
			error: "Veuillez insérer une nom et prénom valide"
		});
	} else if (mod.checkuid(username) === false) {
		return res.render('signup', {
			error: "Votre pseudo ne doit contenir que des lettres et des nombres"
		});
	} else if (mod.checkemail(email) === false) {
		return res.render('signup', {
			error: "Please insert a valide e-mail"
		});
	} else if (pwd !== pwdConf) {
		return res.render('signup', {
			error: "Veuillez insérer des mots de passe identiques"
		});
	} else if (mod.checkpwd(pwd) === false) {
		return res.render('signup', {
			error: "Votre mot de passe doit contenir au munimum 8 lettres contenant une majuscule, une minuscule et un chiffre"
		});
	} else if (!mod.checkdate(mod.sanitize(req.body.date))) {
		return res.render('signup', {
			error: "You must enter a valid date"
		});
	} else if (mod.dateDiff(birthday, today) < 18 || mod.dateDiff(birthday, today) > 90) {
		return res.render('signup', {
			error: "You must have atleast 18 years old"
		});
	}

	pwdHash = crypto.SHA512(pwd).toString();

	mod.pool.getConnection()
	.then(conn => {

		conn.query("USE matcha")
			.then(() => {
				return conn.query("SELECT COUNT(*) as nb FROM users WHERE email=?", [email])
			})
			.then((row) => {
				if (row[0].nb != 0) {
					throw "E-mail already taken";
				}
				return conn.query("SELECT COUNT(*) as nb FROM users WHERE username=?", [username]);
			})
			.then((row) => {
				if (row[0].nb != 0) {
					throw "Username already taken";
				}
			})
			.then(() => {
				conn.query("INSERT INTO users(firstname, lastname, username, pwd, email, confirm, birthday) VALUES(?, ?, ?, ?, ?, ?, ?)", [firstname, lastname, username, pwdHash, email, confirm, birthday]);
				return conn.query("SELECT id_usr FROM users WHERE username = ?", [username]);
			})
			.then((resu) => {
				conn.query("INSERT INTO confirm(id_usr, confirmkey) VALUES(?, ?)", [resu[0].id_usr, crypto.SHA512(confirmKey).toString()]);
				var transporter = nodemailer.createTransport({
						service: 'gmail',
						auth: {
							user: 'matcha.mmoussa.atelli@gmail.com',
							pass: 'compteaminemohamad'
						}
					});

					var mailOptions = {
						from: 'matcha.mmoussa.atelli@gmail.com',
						to: email,
						subject: 'Confirm your account',
						html: `<html>
						<body>
						<a href="http://localhost:8888/login/confirm-acc?id_usr=` + resu[0].id_usr + `&confirmkey=` + confirmKey + `">Confirm your account</a>
						</body>
						</html>`
					};

					transporter.sendMail(mailOptions, function(error, info){
						if (error) {
							console.log(error);
						}
					});
				conn.end();
				return res.render('login', {
					popupTitle: 'Sign up',
					popupMsg: 'Signed up with success<br />Check your mails',
					popup: true
				});
			})
			.catch(err => {
				console.log(err);
				conn.end();
				return res.render('signup', {
					error: err
				});
			})

		}).catch(err => {
		 conn.end();
	});


});

router.post('/check', mod.sanitizeInputForXSS, function (req, res) {

	const item = mod.sanitize(req.body.item);
	const type  = mod.sanitize(req.body.type);

	if (type === 'email') {
		mod.pool.getConnection()
		.then(conn => {

			conn.query("USE matcha")
			.then((rows) => {
				return conn.query("SELECT COUNT(*) as nb FROM users WHERE email=?", [item]);
			})
			.then((response) => {
				if (response[0].nb != 0) {
					res.send("Unavailable");
				} else {
					if (!mod.checkemail(item)) {
						res.send('Unavailable');
					} else {
						res.send("Available");
					}
				}
				conn.end();
			})
			.catch(err => {
				console.log(err);
				conn.end();
			})

		}).catch(err => {
		});
	} else if (type === 'uname') {
		mod.pool.getConnection()
			.then(conn => {

				conn.query("USE matcha")
					.then((rows) => {
						return conn.query("SELECT COUNT(*) as nb FROM users WHERE username=?", [item]);
					})
					.then((response) => {
						if (response[0].nb != 0) {
							res.send("Unavailable");
						} else {
							if (!mod.checkuid(item)) {
								res.send('Unavailable');
							} else {
								res.send("Available");
							}
						}
						conn.end();
					})
					.catch(err => {
						//handle error
						console.log(err);
						conn.end();
					})

				}).catch(err => {
				//not connected
			});
	} else if (type === 'lname' || type === 'fname') {
		if (!mod.checkname(item)) {
			res.send('Unavailable');
		} else {
			res.send('Available');
		}
	} else if (type === 'pwd') {
		if (!mod.checkpwd(item)) {
			res.send('Unavailable');
		} else {
			res.send('Available');
		}
	} else if (type === 'pwd' || type === 'confpwd') {
		if (!mod.checkpwd(item)) {
			res.send('Unavailable');
		} else {
			res.send('Available');
		}
	} else if (type === 'date') {
		birthday = new Date(item);
		today = new Date();
		if (!mod.checkdate(item)) {
			res.send('Unavailable');
		} else if (mod.dateDiff(birthday, today) < 18 || mod.dateDiff(birthday, today) > 90) {
			res.send('Unavailable');
		} else {
			res.send('Available');
		}
	}

});

module.exports = router;
