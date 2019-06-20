const express = require('express');
const mod = require('./mod');
const crypto = require('crypto-js');

var router = express.Router();

  router.get('/', function (req, res) {
    res.render('index', {
      title: 'Matcha'
    });
  });

  router.get('/confirm-acc', function (req, res) {
    newKey = mod.randomString(50, '0123456789abcdefABCDEF');
    if (req.query.id_usr !== "") {
      id_usr = req.query.id_usr;
    }
    if (req.query.confirmkey !== "") {
      confirmkey = req.query.confirmkey;
    }
    if (req.query.confirmkey !== "" && req.query.id_usr !== "") {
      mod.pool.getConnection()
      .then(conn => {

        conn.query("USE matcha")
          .then(() => {
            return conn.query("SELECT COUNT(*) as nb FROM confirm WHERE id_usr = ? AND confirmkey = ?", [id_usr, crypto.SHA512(confirmkey).toString()]);
          })
          .then((row) => {
            console.log(row[0]);
            if (row[0].nb === 1) {
              return conn.query("SELECT * FROM USERS WHERE id_usr = ?", [id_usr]);
            } else {
              conn.end();
              res.render('index', {
                title: 'Matcha',
                popupTitle: "Request",
                popupMsg: "Your request expired",
                popup: true
              });
              return false
            }
          })
          .then((result) => {
            if (result) {
              if (result[0].id_usr == id_usr) {
                if (result[0].confirm == 1) {
                  res.render('index', {
                    title: 'Matcha',
                    popupTitle: "Account",
                    popupMsg: "Your account is already confirmed",
                    popup: true
                  });
                } else {
                  conn.query("UPDATE USERS SET confirm = 1 WHERE id_usr = ?", [id_usr]);
                  conn.query("DELETE FROM confirm WHERE id_usr = ?", [id_usr]);
                  conn.end();
                  res.render('index', {
                    title: 'Matcha',
                    popupTitle: "Account",
                    popupMsg: "Your account has been confirmed",
                    popup: true
                  });
                }
              }
            }
          })
          .catch(err => {
            //handle error
            console.log(err);
            conn.end();
            res.render('index', {
              title: 'Matcha',
              popupTitle: "Request",
              popupMsg: "Your request expired",
              popup: true
            });
          })

      }).catch(err => {
        //not connected
      });
    }
  });


  module.exports = router;
