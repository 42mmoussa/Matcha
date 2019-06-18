const express = require('express');
const mod = require('./routes/mod');
const crypto = require('crypto-js');

var router = express.Router();

var todoItems = [
    { id: 1, desc: 'foo' },
    { id: 2, desc: 'bar' },
    { id: 3, desc: 'baz' }
  ]

  router.get('/', function (req, res) {
    res.render('index', {
      title: 'Matcha',
      items: todoItems
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
          .then((rows) => {
            console.log(rows); //[ {val: 1}, meta: ... ]
            //Table must have been created before
            // " CREATE TABLE myTable (id int, val varchar(255)) "
            row = conn.query("SELECT COUNT(*) as nb FROM confirmacc WHERE id_usr = ? AND confirmkey = ?", [id_usr, crypto.SHA512(confirmkey).toString()]);
            if (row[0].nb === 1) {
              return conn.query("SELECT * FROM USERS WHERE id_usr = ?", [id_usr]);
            } else {
              return false;
            }
          })
          .then((result) => {
            if (result[0].id_usr == id_usr) {
              if (result[0].confirm == 1) {
                res.render('index', {
                  title: 'Matcha',
                  items: todoItems,
                  popupTitle: "Account",
                  popupMsg: "Your account is already confirmed",
                  popup: true
                });
              } else {
                conn.query("UPDATE USERS SET confirm = 1 WHERE id_usr = ? AND confirm = 0", [id_usr]);
                conn.query("UPDATE USERS SET confirmkey = ? WHERE id_usr = ?", [crypto.SHA512(newKey).toString(), id_usr]);
                conn.end();
                res.render('index', {
                  title: 'Matcha',
                  items: todoItems,
                  popupTitle: "Account",
                  popupMsg: "Your account has been confirmed",
                  popup: true
                });
              }
            }
          })
          .catch(err => {
            //handle error
            console.log(err);
            conn.end();
            res.render('index', {
              title: 'Matcha',
              items: todoItems,
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

  router.post('/add', function (req, res) {
    var newItem = req.body.newItem;

    todoItems.push({
      id: todoItems.length + 1,
      desc: newItem
    });

    res.redirect('/');
  });

  module.exports = router;
