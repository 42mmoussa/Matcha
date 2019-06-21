const express = require('express');
const router = express.Router();
const session = require('express-session');
const crypto = require('crypto-js');
const mod = require('./mod');

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
				console.log(rows[0].nb);
				if (rows[0].nb !== 0) {
					return res.redirect('/');
	    		} else {
					return res.render('create-profile', {});
		    	}
            });
        })
	} else {
		return res.redirect('/');
	}
});

module.exports = router;
