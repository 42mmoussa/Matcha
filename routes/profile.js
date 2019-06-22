const express = require('express');
const router = express.Router();
const session = require('express-session');
const crypto = require('crypto-js');
const formidable = require('formidable');
const fs = require('fs');
const mod = require('./mod');
let	  today = new Date();

router.get('/', function(req, res) {
  if (req.session.connect) {

    mod.pool.getConnection()
    .then((conn) => {
      conn.query("USE matcha")
      .then(() => {
        return conn.query("SELECT * FROM profiles WHERE id_usr = ?", req.session.user.id)
      })
      .then((rows) => {
        if (rows[0].id_usr) {
          return res.render('profile', {
            orientation: rows[0].orientation.substring(0, rows[0].orientation.length - 2)
          });
        } else {
          return res.render('profile', {
            popup: true,
            popupMsg: "This user did not create a profile",
            popupTitle: 'Informations missing'
          });
        }
      })
      .catch(err => {
        console.log(err);
        conn.end();
      });
    })
  } else {
    res.redirect('/');
  }
});

router.get('/create-profile', function(req, res) {
    if (req.session.connect)
    {
        mod.pool.getConnection()
		.then((conn) => {
			conn.query("USE matcha")
			.then(() => {
				return conn.query("SELECT COUNT(*) as nb FROM profiles WHERE id_usr = ?", req.session.user.id)
			})
			.then((rows) => {
				if (rows[0].nb !== 0) {
					return res.redirect('/');
	    		} else {
					conn.query("SELECT * FROM users WHERE id_usr = ?", req.session.user.id)
					.then((info) => {
						let birthday = new Date(info[0].birthday);
						return res.render('create-profile', {
							age: mod.dateDiff(birthday, today)
						  });
					  });
				    }
            });
        })
	} else {
		return res.redirect('/');
	}
});

router.post('/submit-create', function(req, res) {
  var name           = req.body.staticName;
  var username       = req.body.staticUsername;
  var gender         = req.body.gender;
  var bio            = req.body.bio;
  var photo          = req.body.photo;
  var birthday       = new Date(req.session.user.birthday);

  var choice = {
    Heterosexual         : req.body.heterosexual,
    Homosexual           : req.body.homosexual,
    Bisexual             : req.body.bisexual,
    Asexual              : req.body.asexual,
    Pansexual            : req.body.pansexual,
    Questioning          : req.body.questioning,
    Other                : req.body.other
  }

  var orientation = '';

  for (var property in choice) {
    if (choice[property] == 'on') {
      orientation = orientation + property + ", ";
    }
  }

  if (orientation == '') {
          orientation = 'bisexual';
  }

  if (name != (req.session.user.lastname + " " + req.session.user.firstname) || username != req.session.user.username || gender == undefined) {
    return res.render('create-profile', {
      warning: "Veuillez remplir toutes les cases",
      age: mod.dateDiff(birthday, today)
    });
  }
  else
    if (req.session.connect) {
      mod.pool.getConnection()
        .then((conn) => {
          conn.query("USE matcha;")
          .then(() => {
              let age = mod.dateDiff(birthday, today);
              conn.query("INSERT INTO profiles(id_usr, firstname, lastname, username, gender, age, bio, orientation) VALUES(?, ?, ?, ?, ?, ?, ?, ?)", [req.session.user.id, req.session.user.firstname, req.session.user.lastname, req.session.user.username, gender, age, bio, orientation]);
              var form = new formidable.IncomingForm();
              conn.end();
              res.redirect("/");
          });
        });
    }
  });

module.exports = router;
