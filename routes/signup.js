const express   = require('express');
const router    = express.Router();
const session   = require('express-session');
const mod       = require('./mod');
const crypto    = require('crypto-js');
const validator = require("email-validator");
const nodemailer  = require('nodemailer');

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
  var email          = req.body.email;
  var confirm        = 0;
  var confirmKey     = mod.randomString(50, '0123456789abcdefABCDEF');

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

  pwdHash = crypto.SHA512(pwd).toString();

  mod.pool.getConnection()
  .then(conn => {

    conn.query("USE matcha")
      .then(() => {
        return conn.query("SELECT COUNT(*) as nb FROM USERS WHERE email=?", [email])
      })
      .then((row) => {
        if (row[0].nb != 0) {
          throw "E-mail already taken";
        }
        return conn.query("SELECT COUNT(*) as nb FROM USERS WHERE username=?", [username]);
      })
      .then((row) => {
        if (row[0].nb != 0) {
          throw "Username already taken";
        }
      })
      .then(() => {
        conn.query("INSERT INTO USERS(firstname, lastname, username, pwd, email, confirm) VALUES(?, ?, ?, ?, ?, ?)", [firstname, lastname, username, pwdHash, email, confirm]);
        return conn.query("SELECT id_usr FROM USERS WHERE username = ?", [username]);
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
            <a href="http://localhost:8888/confirm-acc?id_usr=` + resu[0].id_usr + `&confirmkey=` + confirmKey + `">Confirm your account</a>
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
        return res.render('login', {
          popupTitle: 'Sign up',
          popupMsg: 'Signed up with success<br />Check your mails',
          popup: true
        });
      })
      .catch(err => {
        //handle error
        console.log(err);
        conn.end();
        return res.render('signup', {
          error: err
        });
      })

    }).catch(err => {
    //not connected
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
        return conn.query("SELECT COUNT(*) as nb FROM users WHERE email=?", [item]);
      })
      .then((response) => {
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
            return conn.query("SELECT COUNT(*) as nb FROM users WHERE username=?", [item]);
          })
          .then((response) => {
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
