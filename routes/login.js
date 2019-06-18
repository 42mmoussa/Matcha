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
	var username		= req.body.uname;
<<<<<<< HEAD
	var passwd			= crypto.SHA512(req.body.passwd).toString();

	var data = {
		username:	username,
		passwd:		passwd
	};

	console.log(JSON.stringify(mod, null, 4));
	
	if (username === "" || passwd === "") {
=======
	var pwd			= crypto.SHA512(req.body.passwd).toString();

	if (username === "" || pwd === "") {
>>>>>>> mmoussa
		return res.render('login', {
			warning: "Please fill out all required fields"
		});
	}
<<<<<<< HEAD
	
	mod.pool.getConnection()
		.then(conn => {
		
=======

	mod.pool.getConnection()
		.then(conn => {

>>>>>>> mmoussa
		  conn.query("USE matcha")
			.then((rows) => {
			  console.log(rows); //[ {val: 1}, meta: ... ]
			  //Table must have been created before
<<<<<<< HEAD
			  return conn.query("SELECT * FROM USERS WHERE username = ? AND passwd = ? AND confirm = 1", [username, passwd]);
			})
			.then((result) => {
				console.log(result[0].username);
				if (result[0].username === username) {
					return res.render('about', {
=======
			  return conn.query("SELECT * FROM USERS WHERE username = ? AND passwd = ?", [username, pwd]);
			})
			.then((result) => {
				console.log(result[0]);
				if (result[0].confirm === 1) {
					return res.render('login', {
>>>>>>> mmoussa
						popupTitle: 'Login',
						popupMsg: 'Logged with success',
						popup: true
					});
<<<<<<< HEAD
				}
=======
				} else {
          return res.render('login', {
            error: "Account not confirmed"
          });
        }
>>>>>>> mmoussa
			  conn.end();
			})
			.catch(err => {
				//handle error
<<<<<<< HEAD
				console.log(err); 
				return res.render('about', {
					popupTitle: 'Login',
					popupMsg: 'Wrong Login',
					popup: true
				});
				conn.end();
			})
			
=======
				console.log(err);
				return res.render('login', {
					error: "User does not exist"
				});
				conn.end();
			})

>>>>>>> mmoussa
		}).catch(err => {
			//not connected
		});
});


module.exports = router;
