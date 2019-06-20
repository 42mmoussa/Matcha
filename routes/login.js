const express = require('express');
const router = express.Router();
const session = require('express-session');
const crypto = require('crypto-js');
const mod = require('./mod');

router.get('/', function (req, res) {
  if (req.session.userId) {
    return res.resdirect('index');
  }
  else {
    return res.render('login', {
    });
  }
});

router.post('/login_validation', function(req, res) {
	var login		= req.body.uname;
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
			  //Table must have been created before
			  return conn.query("SELECT * FROM USERS WHERE username = ? OR email=? AND pwd = ?", [login, login, pwd]);
			})
			.then((result) => {
				if (result[0].confirm === 1) {
          req.session.userId = result[0].id_usr;
          console.log(req.session);
          return res.redirect('/?success=login');
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
