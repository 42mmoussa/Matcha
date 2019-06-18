var express = require('express');
var router = express.Router();
var session = require('express-session');
var crypto = require('crypto-js');
var mod = require('./mod');
var nodemailer = require('nodemailer');

router.get('/', function (req, res) {
  return res.render('signup', {
  });
});

router.post('/signup_validation', function (req, res) {
  // var email = req.body.Username;
  var lastname       = req.body.lname;
  var firstname      = req.body.fname;
  var username       = req.body.uname;
  var passwd         = crypto.SHA512(req.body.passwd).toString();
  var confPasswd     = crypto.SHA512(req.body.confPasswd).toString();
  var email          = req.body.email;
  var confirm         = 0;

var confirmKey = mod.randomString(50, '0123456789abcdefABCDEF');

  var data = {
    lastname: lastname,
    firstname: firstname,
    username: username,
    passwd: passwd,
    confPasswd: confPasswd,
    email: email,
    confirm: confirm,
    confirmKey: confirmKey
  };

  console.log(JSON.stringify(mod, null, 4));

  if (lastname === "" || firstname === "" || username === "" || passwd === "" || confPasswd === "" || email === "") {
    return res.render('signup', {
      warning: "Please fill out all required fields"
    });
  } else {
    if (mod.checkuid(username) === false) {
      return res.render('signup', {
        error: "Your username can only contain letters and numbers"
      });
    }
    if (passwd !== confPasswd) {
      return res.render('signup', {
        error: "Passwords don't match."
      });
    }
  }

  mod.pool.getConnection()
    .then(conn => {
    
      conn.query("USE matcha")
        .then((rows) => {
          console.log(rows); //[ {val: 1}, meta: ... ]
          //Table must have been created before 
          // " CREATE TABLE myTable (id int, val varchar(255)) "
          conn.query("INSERT INTO USERS(firstname, lastname, username, passwd, email, confirmkey, confirm) VALUES(?, ?, ?, ?, ?, ?, ?)", [firstname, lastname, username, passwd, email, crypto.SHA512(confirmKey).toString(), confirm]);
          return conn.query("SELECT id_usr FROM USERS WHERE username = ?", [username]);
        })
        .then((res) => {
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
            <a href="http://localhost:8888/?username=` + res[0].id_usr + `&confirmkey=` + confirmKey + `">Confirm your account</a>
            </body>
            </html>`
          };
        
          transporter.sendMail(mailOptions, function(error, info){
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
          conn.end();
        })
        .catch(err => {
          //handle error
          console.log(err); 
          conn.end();
        })
        })
        .catch(err => {
      //not connected
    });
  // if error
  // res.render('signup', {
  //   warning: "Ceci est un warning",
  //   error: "Ceci est une erreur",
  //   success: "Ceci est un succes"
  // });
  // endif error

  return res.render('login', {
    popupTitle: 'Sign up',
    popupMsg: 'Signed up with success',
    popup: true
  });
});

module.exports = router;
