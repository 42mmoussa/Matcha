const express = require('express');
const mod = require('./mod');
const crypto = require('crypto-js');

var router = express.Router();

  router.get('/', function (req, res) {
    if (req.session.connect && req.query.success === 'login') {
      return res.render('index', {
        popupTitle: "Login",
        popupMsg: "Logged in with success",
        popup: true
      });
    }
    return res.render('index', {

    });
  });

  router.get('/logout', function (req, res) {

    if (req.session.connect) {
      req.session.user = undefined;
      req.session.connect = undefined;
      return res.render('index', {
        popupTitle: "Logout",
        popupMsg: "Logged out with success",
        popup: true
      });
    }
    return res.render('index', {

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
              return conn.query("SELECT * FROM users WHERE id_usr = ?", [id_usr]);
            } else {
              conn.end();
              res.render('index', {
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
                    popupTitle: "Account",
                    popupMsg: "Your account is already confirmed",
                    popup: true
                  });
                } else {
                  conn.query("UPDATE users SET confirm = 1 WHERE id_usr = ?", [id_usr]);
                  conn.query("DELETE FROM confirm WHERE id_usr = ?", [id_usr]);
                  conn.end();
                  res.render('index', {
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

//////////////////////////////UPLOAD////////////////////////////////////////////
  const multer = require('multer');
  const fs = require('fs');



  router.post('/upload', function (req, res) {
    if (req.session.connect) {
      var path_pp =  "img/" + req.session.user.id;

      // if file does not exist, create it
      if (!fs.existsSync('img')) {
        fs.mkdirSync('img');
      }
      if (!fs.existsSync(path_pp)) {
        fs.mkdirSync(path_pp);
      }

      var Storage = multer.diskStorage({
        destination: function(req, file, callback) {
          callback(null, path_pp);
        },
        filename: function(req, file, callback) {
          callback(null, "profile.jpg");
        }
      });

      var upload = multer({
        storage: Storage
      }).array("imgUploader", 3); //Field name and max count
    }
    if (req.session.connect) {
      upload(req, res, function(err) {
        if (err) {
          return res.end("err");
        }
        return res.end("File uploaded sucessfully!");
      });
    }
  });
//////////////////////////END///UPLOAD//////////////////////////////////////////

  module.exports = router;
