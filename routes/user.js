const express = require('express');
const router = express.Router();
const session = require('express-session');
const crypto = require('crypto-js');
const mod = require('./mod');
let	  today = new Date();

router.get('/', function(req, res) {
    res.render('user', {
    });
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
  var hetero         = req.body.heterosexual;
  var homo           = req.body.homosexual;
  var bi             = req.body.bisexual;
  var asexual        = req.body.asexual;
  var pansexual      = req.body.pansexual;
  var questioning    = req.body.questioning;
  var other          = req.body.other;
  var bio            = req.body.bio;
  var photo          = req.body.photo;
  var birthday       = new Date(req.session.user.birthday);

  if (name != (req.session.user.lastname + " " + req.session.user.firstname) || username != req.session.user.username || gender == undefined || (hetero == undefined && homo == undefined && bi == undefined && asexual == undefined && pansexual == undefined && questioning == undefined && other == undefined)) {
    return res.render('create-profile', {
      warning: "Veuillez remplir toutes les cases",
      age: mod.dateDiff(birthday, today)
    });
  }
  else {
    res.redirect('/user/create-profile');
  }
});

module.exports = router;
