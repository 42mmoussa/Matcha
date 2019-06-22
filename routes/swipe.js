const express = require('express');
const router = express.Router();
const session = require('express-session');
const crypto = require('crypto-js');
const mod = require('./mod');

router.get('/', function(req, res) {
  if (req.session.connect) {
    return res.render('swipe', {
    });
  } else {
    return res.render('index', {
    });
  }
});

router.post('/next', function(req, res) {
  if (req.session.connect) {
    mod.pool.getConnection()
    .then(conn => {

      conn.query("USE matcha")
        .then(() => {
          return conn.query("SELECT * FROM profiles WHERE id_usr=?", [req.session.user.id]);
        })
        .then((dataUser) => {
          if (dataUser[0].orientation === 'heterosexual') {
            let to_find = 'man';
            if (dataUser[0].gendre === 'man') {
              to_find = 'woman';
            }
            return conn.query("SELECT * FROM profiles WHERE orientation=? AND gendre=?", [dataUser[0].orientation, to_find]);
          }
          return conn.query("SELECT * FROM profiles WHERE orientation=?", [dataUser[0].orientation]);
        })

    }).catch(err => {
      //not connected
    });

  } else {
    return res.redirect('/login');
  }
});

module.exports = router;
