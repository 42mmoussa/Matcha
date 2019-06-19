var express = require('express');
var router = express.Router();
var session = require('express-session');
var crypto = require('crypto-js');
var mod = require('./mod');

router.get('/', function (req, res) {
  return res.render('login', {
  });
});

router.post('/login_validation', function(req, res) {
	var login		= req.body.uname;
	var pwd			    = crypto.SHA512(req.body.pwd).toString();

	if (login === "" || pwd === "") {
		return res.render('login', {
			warning: "Please fill out all required fields"
		});
	}

	mod.pool.getConnection()
		.then(conn => {

		  conn.query("USE matcha")
			.then((rows) => {
			  console.log(rows); //[ {val: 1}, meta: ... ]
			  //Table must have been created before
			  return conn.query("SELECT * FROM USERS WHERE username = ? OR email=? AND pwd = ?", [login, login, pwd]);
			})
			.then((result) => {
				console.log(result[0]);
				if (result[0].confirm === 1) {
					return res.render('login', {
						popupTitle: 'Login',
						popupMsg: 'Logged with success',
						popup: true
					});
				} else {
          return res.render('login', {
            error: "Account not confirmed"
          });
        }
			  conn.end();
			})
			.catch(err => {
				//handle error
				console.log(err);
				return res.render('login', {
					error: "Bad password or username"
				});
				conn.end();
			})

		}).catch(err => {
			//not connected
		});
});


module.exports = router;
