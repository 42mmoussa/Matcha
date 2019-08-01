const express    = require('express');
const router     = express.Router();
const mod = require('./mod');

router.get('/', function (req, res) {
    if (req.session.connect) {
      res.redirect('/search/1');
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

			let search = "SELECT * FROM profiles";
			let searchData = [];

			let strTags = req.query.tags;

			if (typeof strTags === 'string') {	
				let tags = strTags.split(' ');
				let i = 0;
				tags.forEach(function (element) {
					if (i === 0) {
						search += " WHERE tags LIKE ?";
						i = 1;
					} else {
						search += " OR tags LIKE ?";
					}
					searchData.push("%" + element + "%");
				});		
			}

			let first = 1;
			if (searchData.length > 0) {
				searchData.forEach(function (element) {
					if (first) {
						search += " ORDER BY ( IF (tags LIKE ? , 1, 0)";
						first = 0;
					} else {
						search += " + IF (tags LIKE ? , 1, 0)";
					}
					searchData.push(element);
				});
				search += ") DESC";
			}

			mod.pool.getConnection()
			.then(conn => {
				conn.query("USE matcha")
				.then(() => {
					search += " LIMIT ?, ?;";
					searchData.push(offset);
					searchData.push(nbElementOnPage);
					console.log(search + " | " + searchData);					
					return conn.query(search, searchData);
				})
				.then(row => {
					conn.end();
					return res.render('search', {
						users: row,
						nbUsers: row.length
					});
				})
				.catch(err => {
					console.log(err);
					conn.end();
					return res.redirect('/search');
				})
			})
		} else {
            return res.redirect('/search');
        }
	} else {
		return res.redirect("/login");
	}

});

module.exports = router;