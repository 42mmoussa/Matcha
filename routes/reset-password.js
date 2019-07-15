const express    = require('express');
const router     = express.Router();
const session    = require('express-session');
const mod        = require('./mod');
const crypto     = require('crypto-js');
const nodemailer = require('nodemailer');

router.get('/', function (req, res) {
  return res.render('reset-password', {
  });
});

router.post('/reset-password/reset', function(req, res) {
	var username		= req.body.uname;
	var confirmKey		= mod.randomString(50, '0123456789abcdefABCDEF');

	if (username == "") {
		return res.render('reset-password', {
			warning: "Please fill out all required fields"
		});
	}

	mod.pool.getConnection()
	.then(conn => {
		conn.query("USE matcha")
		.then((rows) => {
			return conn.query("SELECT * FROM users WHERE (username = ? OR email = ?)", uname);
		})
		.then((result) => {
			conn.query("INSERT INTO confirm(id_usr, confirmkey) VALUES(?, ?)", [result[0].id_usr, crypto.SHA512(confirmKey).toString()]);
			var transporter = nodemailer.createTransport({
				service: 'gmail',
				auth: {
					user: 'matcha.mmoussa.atelli@gmail.com',
					pass: 'compteaminemohamad'
				}
			});

			var mailOptions = {
				from: 'matcha.mmoussa.atelli@gmail.com',
				to: result[0].email,
				subject: 'Reset your password',
				html: `<html>
				<body>
				<a href="http://localhost:8888/reset-password/confirm?id_usr` + result[0].id_usr + `&confirmkey=` + confirmKey + `">Reset your password</a>
				<body>
				</html>` 
			};

			transporter.sendMail(mailOptions, function(error, info) {
				if (error) {
					console.log(error);
				} else {
					console.log('Email sent: ' + info.response);
				}
			});
			conn.end();
		})
		.catch(err => {
			console.log(err);
			conn.end();
			return res.render('reset-password', {
				error: err
			});
		})
	})
	.catch(err => {

	});
});

module.exports = router;
