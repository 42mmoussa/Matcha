var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    if (req.session.connect) {
        return res.render('matchat', {
        });
    } else {
        return res.redirect('/login');
    }
});

router.post('/send', function (req, res) {
    // start socket

    if (req.session.connect) {
        return res.render('matchat', {
        });
    } else {
        return res.redirect('/login');
    }
});

  module.exports = router;
