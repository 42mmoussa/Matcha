const express = require('express');
const mod = require('./mod');
const crypto = require('crypto-js');

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

//////////////////////////////UPLOAD////////////////////////////////////////////
  const multer = require('multer');
  const fs = require('fs');



  router.post('/upload', function (req, res) {
    if (req.session.connect) {
      var path_pp =  "img/" + req.session.user.id;

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
      }).array("imgUploader", 3);
    }
    if (req.session.connect) {
      upload(req, res, function(err) {
        if (err) {
          return res.end("err");
        }
        mod.pool.getConnection()
        .then((conn) => {
          conn.query("USE matcha;")
          .then(() => {
              conn.query("UPDATE profiles SET pictures = pictures + 10 WHERE id_usr = ?;", [req.session.user.id]);
          });
          conn.end();
        });
        return res.redirect("profile");
      });
    }
  });
//////////////////////////END///UPLOAD//////////////////////////////////////////

  module.exports = router;
