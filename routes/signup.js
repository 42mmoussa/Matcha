var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
  res.render('signup', {
    title: 'Signup'
  });
});

router.post('/signup_validation', function (req, res) {


  console.log("ta race");
  res.redirect('/');
});

module.exports = router;
