var express = require('express');
var mod = require('./routes/mod');
var crypto = require('crypto-js');

var router = express.Router();

var todoItems = [
    { id: 1, desc: 'foo' },
    { id: 2, desc: 'bar' },
    { id: 3, desc: 'baz' }
  ]

  router.get('/', function (req, res) {
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
            return conn.query("SELECT * FROM USERS WHERE id_usr = ? AND confirmkey = ?", [id_usr, crypto.SHA512(confirmkey).toString()]);
          })
          .then((result) => {
            if (result[0].id_usr == id_usr) {
              conn.query("UPDATE USERS SET confirm = 1 WHERE id_usr = ?", [id_usr]);
              conn.query("UPDATE USERS SET confirmkey = ? WHERE id_usr = ?", [crypto.SHA512(newKey).toString(), id_usr]);
              conn.end();
            }
          })
          .catch(err => {
            //handle error
            console.log(err); 
            conn.end();
          })
          
      }).catch(err => {
        //not connected
      });
    }
    res.render('index', {
      title: 'Matcha',
      items: todoItems
    });
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
