const express = require('express');

var router = express.Router();

  router.get('/', function (req, res) {
    if (req.session.connect) {
      return res.redirect('/swipe');
    } else {
      return res.render("index");
    }
  });

  router.get('/logout', function (req, res) {

    if (req.session.connect) {
      req.session.destroy();
      return res.redirect('/login');
    }
    return res.redirect('/');
  });

  module.exports = router;
