var express = require('express');
var router = express.Router();

  router.get('/', function (req, res, next) {
    res.render('settings', {
      title: 'About',
      name: 'mmoussa & atelli'
    });
    req.session.localVar = undefined;
    delete(req.session.localVar);
    return true;
  });

  module.exports = router;
