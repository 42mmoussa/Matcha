var express = require('express');
var router = express.Router();
var session = require('express-session');
var mod = require('./mod');

router.get('/', function (req, res) {
  return res.render('signup', {
  });
});

router.post('/signup_validation', function (req, res) {
  // var email = req.body.Username;
  var lastname       = req.body.lname;
  var firstname      = req.body.fname;
  var username       = req.body.uname;
  var city           = req.body.city;
  var arrondissement = req.body.arr;
  var email          = req.body.email;

  var data = {
    lastname: lastname,
    firstname: firstname,
    username: username,
    city: city,
    arrondissement: arrondissement,
    email: email
  };

  console.log(JSON.stringify(mod, null, 4));

  if (lastname === "" || firstname === "" || username === "" || city === "" || arrondissement === "" || email === "") {
    return res.render('signup', {
      warning: "Please fill out all required fields"
    });
  } else {
    if (mod.checkuid(username) === false) {
      return res.render('signup', {
        error: "Your username can only contain letters and numbers"
      });
    }
  }

  // if error
  // res.render('signup', {
  //   warning: "Ceci est un warning",
  //   error: "Ceci est une erreur",
  //   success: "Ceci est un succes"
  // });
  // endif error


  return res.render('login', {
    popup: 'Signed up with success'
  });
});

module.exports = router;
