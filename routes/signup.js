<<<<<<< HEAD
var express = require('express');
var router = express.Router();
var session = require('express-session');
var crypto = require('crypto-js');
var mod = require('./mod');
var nodemailer = require('nodemailer');
const validator = require("email-validator");
=======
const express   = require('express');
const router    = express.Router();
const session   = require('express-session');
const mod       = require('./mod');
const crypto    = require('crypto-js');
const validator = require("email-validator");
const nodemailer  = require('nodemailer');
>>>>>>> mmoussa

router.get('/', function (req, res) {
  return res.render('signup', {
  });
});

router.post('/signup_validation', function (req, res) {

  var lastname       = req.body.lname;
  var firstname      = req.body.fname;
  var username       = req.body.uname;
  var pwd            = req.body.pwd;
  var pwdConf        = req.body.confpwd;
<<<<<<< HEAD
  var passwd         = crypto.SHA512(req.body.pwd).toString();
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

=======
  var email          = req.body.email;
  var confirm        = 0;
  var confirmKey     = mod.randomString(50, '0123456789abcdefABCDEF');

>>>>>>> mmoussa
  console.log(mod.checkname(lastname));

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
  } else if (validator.validate(email) === false) {
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
  }

<<<<<<< HEAD
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
=======
  pwdHash = crypto.SHA512(pwd).toString();

  mod.pool.getConnection()
  .then(conn => {

    conn.query("USE matcha")
      .then((rows) => {
        console.log(rows); //[ {val: 1}, meta: ... ]
        //Table must have been created before
        // " CREATE TABLE myTable (id int, val varchar(255)) "
        conn.query("INSERT INTO USERS(firstname, lastname, username, passwd, email, confirmkey, confirm) VALUES(?, ?, ?, ?, ?, ?, ?)", [firstname, lastname, username, pwdHash, email, crypto.SHA512(confirmKey).toString(), confirm]);
        return conn.query("SELECT id_usr FROM USERS WHERE username = ?", [username]);
      })
      .then((res) => {
        console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
        var transporter = nodemailer.createTransport({
>>>>>>> mmoussa
            service: 'gmail',
            auth: {
              user: 'matcha.mmoussa.atelli@gmail.com',
              pass: 'compteaminemohamad'
            }
          });
<<<<<<< HEAD
        
=======

>>>>>>> mmoussa
          var mailOptions = {
            from: 'matcha.mmoussa.atelli@gmail.com',
            to: email,
            subject: 'Confirm your account',
            html: `<html>
            <body>
<<<<<<< HEAD
            <a href="http://localhost:8888/?id_usr=` + res[0].id_usr + `&confirmkey=` + confirmKey + `">Confirm your account</a>
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

=======
            <a href="http://localhost:8888/confirm-acc?id_usr=` + res[0].id_usr + `&confirmkey=` + confirmKey + `">Confirm your account</a>
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

    }).catch(err => {
    //not connected
  });

>>>>>>> mmoussa
  return res.render('login', {
    popupTitle: 'Sign up',
    popupMsg: 'Signed up with success<br />Check your mails',
    popup: true
  });

});

router.post('/check', function (req, res) {

  const item = req.body.item;
  const type  = req.body.type;

  if (type === 'email') {
    mod.pool.getConnection()
    .then(conn => {

      conn.query("USE matcha")
      .then((rows) => {
        console.log(rows);
        return conn.query("SELECT COUNT(*) as nb FROM users WHERE email=?", [item]);
      })
      .then((response) => {
        console.log(response[0].nb);
        if (response[0].nb != 0) {
          res.send("Unavailable");
        } else {
          if (!validator.validate(item)) {
            res.send('Unavailable');
          } else {
            res.send("Avalaible");
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
  } else if (type === 'uname') {
    mod.pool.getConnection()
      .then(conn => {

        conn.query("USE matcha")
          .then((rows) => {
            console.log(rows);
            return conn.query("SELECT COUNT(*) as nb FROM users WHERE username=?", [item]);
          })
          .then((response) => {
            console.log(response[0].nb);
            if (response[0].nb != 0) {
              res.send("Unavailable");
            } else {
              if (!mod.checkuid(item)) {
                res.send('Unavailable');
              } else {
                res.send("Avalaible");
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
        res.send('Avalaible');
      }
  } else if (type === 'pwd') {
      if (!mod.checkpwd(item)) {
        res.send('Unavailable');
      } else {
        res.send('Avalaible');
      }
  } else if (type === 'pwd' || type === 'confpwd') {
      if (!mod.checkpwd(item)) {
        res.send('Unavailable');
      } else {
        res.send('Avalaible');
      }
  }

});

router.post('/check', function (req, res) {

  const item = req.body.item;
  const type  = req.body.type;

  if (type === 'email') {
    mod.pool.getConnection()
    .then(conn => {

      conn.query("USE matcha")
      .then((rows) => {
        console.log(rows);
        return conn.query("SELECT COUNT(*) as nb FROM users WHERE email=?", [item]);
      })
      .then((response) => {
        console.log(response[0].nb);
        if (response[0].nb != 0) {
          res.send("Unavailable");
        } else {
          if (!validator.validate(item)) {
            res.send('Unavailable');
          } else {
            res.send("Avalaible");
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
  } else if (type === 'uname') {
    mod.pool.getConnection()
      .then(conn => {

        conn.query("USE matcha")
          .then((rows) => {
            console.log(rows);
            return conn.query("SELECT COUNT(*) as nb FROM users WHERE username=?", [item]);
          })
          .then((response) => {
            console.log(response[0].nb);
            if (response[0].nb != 0) {
              res.send("Unavailable");
            } else {
              if (!mod.checkuid(item)) {
                res.send('Unavailable');
              } else {
                res.send("Avalaible");
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
        res.send('Avalaible');
      }
  } else if (type === 'pwd') {
      if (!mod.checkpwd(item)) {
        res.send('Unavailable');
      } else {
        res.send('Avalaible');
      }
  } else if (type === 'pwd' || type === 'confpwd') {
      if (!mod.checkpwd(item)) {
        res.send('Unavailable');
      } else {
        res.send('Avalaible');
      }
  }

});

module.exports = router;
