const express    = require('express');
const router     = express.Router();
const session    = require('express-session');
const mod        = require('./mod');
let data;

router.get('/', function (req, res) {
    if (req.session.connect) {
      res.redirect('/notifications/1');
  	} else {
  		  res.redirect('/login');
  	}
});

router.get('/:page', function (req, res) {

    if (req.session.connect) {
        if (!isNaN(req.params.page) && req.params.page > 0) {

			let nbElementOnPage = 20;
			let page = parseInt(req.params.page, 10) - 1;
			let offset = page * nbElementOnPage;

    		    mod.pool.getConnection()
      			.then(conn => {
      				conn.query("USE matcha")
      				.then(() => {
      					return (
      						conn.query(
      							"SELECT *, DATE_FORMAT(date, '%D %M %Y at %H:%i') as daytime FROM notifications WHERE id_usr = ? ORDER BY id_notifications DESC LIMIT ?, ?;",
      							[req.session.user.id, offset, nbElementOnPage]));
      				})
      				.then (rows => {
                data = {
                    notif: rows,
                    nbNotif: rows.length,
                    page: page + 1
                };
                return (conn.query("SELECT COUNT(*) as count FROM notifications where id_usr = ?;", [req.session.user.id]));
              })
              .then (rows => {
                conn.end();
                data.count = Math.ceil(rows[0].count / nbElementOnPage);
                return res.render("notifications", data);
              })
              .catch(err => {
                console.log(err);
                conn.end();
                res.redirect('/');
              });
      			});
        } else {
            return res.redirect('/notifications');
        }
    } else {
        return res.redirect('/login');
    }
});

module.exports = router;
