const express = require('express');
const router = express.Router();
const session = require('express-session');
const crypto = require('crypto-js');
const mod = require('./mod');

var userSuggest = [];

router.get('/', function(req, res) {
  if (req.session.connect) {
	mod.pool.getConnection()
    .then(conn => {
		conn.query("USE matcha")
		.then(() => {
			return conn.query("SELECT * FROM profiles WHERE id_usr=?", [req.session.user.id]);
		})
        .then((profile) => {
			let b = 0;
			let search = '';
			if (/Heterosexual/.test(profile[0].orientation)) {
				b = 1;
				if (profile[0].gender === 'man') {
					search = "(SELECT * FROM profiles\n\
						WHERE orientation LIKE '%Heterosexual%'\n\
						AND gender = 'woman'\n\
						AND pictures >= 10)";
				} else {
					search = "(SELECT * FROM profiles\n\
						WHERE orientation LIKE '%Heterosexual%'\n\
						AND gender = 'man'\n\
						AND pictures >= 10)";
				}
			}
			if (/Homosexual/.test(profile[0].orientation))
			{
				b = 1;
				if (search !== '')
					search += " UNION "
				if (profile[0].gender === 'man') {
					search += "(SELECT * FROM profiles\n\
						WHERE orientation LIKE '%Homosexual%'\n\
						AND gender = 'man'\n\
						AND pictures >= 10)";
				}
				else {
					search += "(SELECT * FROM profiles\n\
						WHERE orientation LIKE '%Homosexual%'\n\
						AND gender = 'woman'\n\
						AND pictures >= 10)";
				}
			}
			if (/Bisexual/.test(profile[0].orientation))
			{
				b = 1;
				if (search !== '')
					search += " UNION "
				search += "(SELECT * FROM profiles\n\
					WHERE orientation LIKE '%Bisexual%'\n\
					AND (gender = 'man' OR gender = 'woman')\n\
					AND pictures >= 10)";
			}
			if (b == 1) {
				return conn.query(search + "ORDER BY id_usr ASC");
			} else
				return null;
        }).then((row) => {
			if (row === null) {
				conn.end();
				return res.render('swipe', {
					popupTitle: 'Swipe',
					popupMsg: 'We\'ve found no one, you are unique !',
					popup: true
				});
			}
			conn.end();
			// var i = -1;
			// while (++i < row.length)
			// 	console.log(row[i]);
			return res.render('swipe', {
				nb_usr: row.length,
				users: row
			});
		});
	}).catch(err => {
		//not connected
	});
  } else {
    return res.redirect('/');
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
