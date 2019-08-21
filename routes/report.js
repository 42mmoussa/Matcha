const express = require('express');
const mod = require('./mod');
const crypto = require('crypto-js');
const nodemailer = require('nodemailer');

var router = express.Router();

router.get('/', function (req, res) {
	if (req.session.connect) {
		if (req.query.id == undefined) {
			return res.render("index");
		}
		mod.pool.getConnection()
		.then(conn => {
			conn.query("USE matcha")
			.then(() => {
				return conn.query("SELECT * FROM profiles WHERE id_usr = ?", [req.query.id])
				.then(rows => {
					if (rows[0]) {
						conn.end();
						return res.render('report', {
							name: rows[0].firstname.charAt(0).toUpperCase() + rows[0].firstname.slice(1) + " " + rows[0].lastname.toUpperCase(),
							id: rows[0].id_usr
						});
					}
					else 
					  return res.render("index");
				})
			})
		})
	} else {
	  return res.render("index");
	}
});

router.post('/confirm_report', function (req, res) {
	if (!req.session.connect)
		return res.render("index");
	if (req.query.id){
		mod.pool.getConnection()
		.then(conn => {
			conn.query("USE matcha")
			.then(() => {
				return conn.query("SELECT * FROM profiles WHERE id_usr = ?", [req.query.id])
				.then(rows => {
					if (rows.length !== 0) {
						already_blocked = rows[0].blocked_user;
						new_blocked = already_blocked + req.query.id + ',';
						conn.query("UPDATE profiles SET blocked_user = ? WHERE id_usr = ?", [new_blocked, req.session.id]);
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
							to: 'matcha.mmoussa.atelli@gmail.com',
							subject: 'User ' + req.query.id + " reported by " + req.session.user.id,
							html: `<p>User with id ` + req.session.user.id + ` reported user with id ` + req.query.id + ` for this reason :<br/>
							` + req.body.reason.trim() + `</p>`
						};
						transporter.sendMail(mailOptions, function(error, info){
							if (error) {
								console.log(error);
							} else {
								console.log('Email sent: ' + info.response);
							}
						});
						res.render('settings', {
							popup: true,
							popupTitle: "User Reported",
							popupMsg: "User reported with success"
						});
					}
				})
			})
		})
	}
	else
		res.redirect('/index');
})

module.exports = router;
