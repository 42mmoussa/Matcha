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
	var passwd			= crypto.SHA512(req.body.passwd).toString();

	var data = {
		username:	username,
		passwd:		passwd
	};

	console.log(JSON.stringify(mod, null, 4));
	
	if (username === "" || passwd === "") {
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
			  return conn.query("SELECT * FROM USERS WHERE username = ? AND passwd = ?", [username, passwd]);
			})
			.then((res) => {
			  console.log(res[0].username);
			  result = res[0].username;
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
	return res.render('about', {
		popupTitle: 'Login',
		popupMsg: 'Logged with success',
		popup: true
	});
});


module.exports = router;
