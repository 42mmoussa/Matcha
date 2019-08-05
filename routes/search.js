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
	let results = {};
	
	if (req.session.connect) {
		
		if (!isNaN(req.params.page) && req.params.page > 0) {

			let nbElementOnPage = 20;
			let page = parseInt(req.params.page, 10) - 1;
			let offset = page * nbElementOnPage;

			let search = "SELECT COUNT(*) OVER () as count, id_usr, firstname, lastname, username, gender, birthday, orientation, pictures, tags FROM profiles";
      		let searchData = [];
			let searchCol = [];

      		let i = 0;

			let tags = req.query.tags;

			if (tags !== undefined) {
				if (typeof tags === "string") {
					if (i === 0) {
						search += " WHERE tags LIKE ?";
						i = 1;
					} else {
						search += " OR tags LIKE ?";
					}
					searchData.push("%" + tags + ",%");
					searchCol.push("tags");
				} else {
					tags.forEach(function (element) {
						if (i === 0) {
							search += " WHERE tags LIKE ?";
							i = 1;
						} else {
							search += " OR tags LIKE ?";
						}
						searchData.push("%" + element + ",%");
						searchCol.push("tags");
					});
				}
			}

			let strAge = req.query.age;

			if (strAge !== undefined && (strAge[0] != 0 || strAge[1] != 100)) {
				let from = mod.ageToDate(parseInt(strAge[0]));
				let to = mod.ageToDate(parseInt(strAge[1]) + 1);
				if (from > to) {
					let c = from;
					from = to;
					to = c;
				}
				if (i === 0) {
					search += " WHERE (birthday BETWEEN ? AND ?)";
					i = 1;
				} else {
					search += " OR (birthday BETWEEN ? AND ?)";
				}
				searchData.push(from);
				searchData.push(to);
				searchCol.push("birthday");
			}

			let first = 0;

			let order = req.query.order;
			const lstOrder = [
				"age",
				"popularity"
			]
			console.log(typeof order);
			if (lstOrder.includes(order)) {
				if (order === "age") {
					search += " ORDER BY birthday DESC";
				}
			}
			else if (searchData.length > 0) {
				searchCol.forEach(function (element) {
					if (first === 0) {
						if (element === 'birthday') {
							search += " ORDER BY ( IF ((birthday BETWEEN ? AND ?) , 1, 0)";
							searchData.push(searchData[first]);
							first++;
							searchData.push(searchData[first]);
						} else {
							search += " ORDER BY ( IF (tags LIKE ? , 1, 0)";
							searchData.push(searchData[first]);
						}
					} else {
						if (element === 'birthday') {
							search += " + IF ((birthday BETWEEN ? AND ?) , 1, 0)";
							searchData.push(searchData[first]);
							first++;
							searchData.push(searchData[first]);
						} else {
							search += " + IF (tags LIKE ? , 1, 0)";
							searchData.push(searchData[first]);
						}
					}
					first++;
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
					if (row.length != 0) {
						let i = -1;
						let today = new Date();
						while (++i < row.length) {
							let bday = new Date(row[i].birthday);
							row[i].age = mod.dateDiff(bday, today);
							if (row[i].tags != null) {
								row[i].tags = row[i].tags.replace(/,/g, ' ');
							}
						}
						results = row;
					}
					return conn.query("SELECT * FROM tags ORDER BY nb_tag ASC");
				})
				.then(tags => {
					conn.end();
					if (typeof results.length === "undefined") {
						return res.render('search', {
							tags: tags,
							nbTags: tags.length,
							users: results,
							nbUsers: 0,
							page: 1,
							count: 0,
							popup: true,
							popupMsg: "no user found",
							popupTitle: "Search"
						});
					}
					return res.render('search', {
						tags: tags,
						nbTags: tags.length,
						users: results,
						nbUsers: results.length,
						page: page + 1,
						count: Math.ceil(results[0].count / nbElementOnPage),
						filters: req.query
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
