var express = require('express');
var router = express.Router();
var session = require('express-session');

router.get('/', function (req, res) {
  res.render('signup', {
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

  console.log(data);

  if (lastname === "" || firstname === "" || username === "" || city === "" || arrondissement === "" || email === "") {
    res.render('signup', {
      warning: "Please fill out all required fields"
    });
  }

  // if error
  // res.render('signup', {
  //   warning: "Ceci est un warning",
  //   error: "Ceci est une erreur",
  //   success: "Ceci est un succes"
  // });
  // endif error


  res.redirect("/");
});

module.exports = router;
