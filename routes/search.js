const express    = require('express');
const router     = express.Router();
const mod = require('./mod');

router.get('/', function (req, res) {
    if (req.session.connect) {
      if (req.session.user.age < 18) {
        return res.redirect("/settings/change-birthdate");
      }
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
			let distCalc = "111.111 *"+
						"DEGREES(ACOS(LEAST(COS(RADIANS(lat))"+
						" * COS(RADIANS(?))"+
						" * COS(RADIANS(lng - ?))"+
						" + SIN(RADIANS(lat))"+
						" * SIN(RADIANS(?)), 1.0)))";

			let search = "SELECT COUNT(*) OVER () as count, id_usr, firstname, lastname, username, gender, birthday, orientation, pictures, tags, lat, lng, pop, Dist FROM (SELECT id_usr, firstname, lastname, username, gender, birthday, orientation, pictures, tags, lat, lng, pop, "+
						distCalc + " As Dist"+
						" FROM profiles) as res"+
						" WHERE res.id_usr != ?";
      		let searchData = [];
			let searchCol = [];

      		let i = 0;

			let tags = req.query.tags;

			if (tags !== undefined) {
				if (typeof tags === "string") {
					if (i === 0) {
						search += " AND( res.tags LIKE ?";
						i = 1;
					} else {
						search += " OR res.tags LIKE ?";
					}
					searchData.push("%" + tags + ",%");
					searchCol.push("tags");
				} else {
					tags.forEach(function (element) {
						if (i === 0) {
							search += " AND( res.tags LIKE ?";
							i = 1;
						} else {
							search += " OR res.tags LIKE ?";
						}
						searchData.push("%" + element + ",%");
						searchCol.push("tags");
					});
				}
			}

			let strAge = req.query.age;

			if (strAge !== undefined && (strAge[0] !== "18" || strAge[1] !== "100")) {
				let from = mod.ageToDate(parseInt(strAge[0]));
				let to = mod.ageToDate(parseInt(strAge[1]) + 1);
				if (from > to) {
					let c = from;
					from = to;
					to = c;
				}
				if (i === 0) {
					search += " AND( (res.birthday BETWEEN ? AND ?)";
					i = 1;
				} else {
					search += " OR (res.birthday BETWEEN ? AND ?)";
				}
				searchData.push(from);
				searchData.push(to);
				searchCol.push("birthday");
			}

			let popTab = req.query.popularity;

			if (popTab !== undefined && (parseInt(popTab[0]) != 1 || parseInt(popTab[1]) != 500)) {
				let from = parseInt(popTab[0]);
				let to = parseInt(popTab[1]);
				if (from > to) {
					let c = from;
					from = to;
					to = c;
				}
				if (i === 0) {
					search += " AND( (res.pop BETWEEN ? AND ?)";
					i = 1;
				} else {
					search += " OR (res.pop BETWEEN ? AND ?)";
				}
				searchData.push(from);
				searchData.push(to);
				searchCol.push("popularity");
			}

 			let strDist = req.query.distance;

			if (strDist !== undefined && parseInt(strDist) < 30) {
				let maxdist = parseInt(strDist);
				if (i === 0) {
					search += " AND( (res.Dist < ?)";
					i = 1;
				} else {
					search += " OR (res.Dist < ?)";
				}
				searchData.push(maxdist);
				searchCol.push("Distance");
			}

			if (i === 1) {
				search += ")";
			}

			let first = 0;

			let order = req.query.order;
			const lstOrder = [
				"age",
				"distance",
				"popularity",
				"tags"
			]
			if (lstOrder.includes(order)) {
				if (order === "age") {
					search += " ORDER BY res.birthday DESC";
				} else if (order === "distance") {
					search += " ORDER BY res.Dist ASC";
				} else if (order === "popularity") {
					search += " ORDER BY res.pop DESC";
				} else if (order === "tags") {
					if (tags !== undefined) {
						if (typeof tags === "string") {
							search += " ORDER BY ( IF (res.tags LIKE ? , 1, 0))";
							searchData.push("%" + tags + ",%");
						} else {
							i = 0;
							tags.forEach(function (element) {
								if (i === 0) {
									search += " ORDER BY ( IF (res.tags LIKE ? , 1, 0)";
									i = 1;
								} else {
									search += " + IF (res.tags LIKE ? , 1, 0)";
								}
								searchData.push("%" + element + ",%");
								searchCol.push("tags");
							});
							search += " ) DESC";
						}
					}
				}
			} else if (searchData.length > 0) {
				searchCol.forEach(function (element) {
					if (first === 0) {
						if (element === 'birthday') {
							search += " ORDER BY ( IF ((res.birthday BETWEEN ? AND ?) , 1, 0)";
							searchData.push(searchData[first]);
							first++;
							searchData.push(searchData[first]);
						} else if (element === 'Distance') {
							search += " ORDER BY ( IF (res.Dist < ? , 1, 0)";
							searchData.push(searchData[first]);
						} else if (element === 'popularity') {
							search += " ORDER BY ( IF ((res.pop BETWEEN ? AND ?) , 1, 0)";
							searchData.push(searchData[first]);
							first++;
							searchData.push(searchData[first]);
						} else {
							search += " ORDER BY ( IF (res.tags LIKE ? , 1, 0)";
							searchData.push(searchData[first]);
						}
					} else {
						if (element === 'birthday') {
							search += " + IF ((res.birthday BETWEEN ? AND ?) , 1, 0)";
							searchData.push(searchData[first]);
							first++;
							searchData.push(searchData[first]);
						} else if (element === 'Distance') {
							search += " + IF (res.Dist < ? , 1, 0)";
							searchData.push(searchData[first]);
						} else if (element === 'populaity') {
							search += " + IF ((res.pop BETWEEN ? AND ?) , 1, 0)";
							searchData.push(searchData[first]);
							first++;
							searchData.push(searchData[first]);
						} else {
							search += " + IF (res.tags LIKE ? , 1, 0)";
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
					return conn.query("SELECT * FROM profiles WHERE id_usr = ?", [req.session.user.id])
				})
				.then((me) => {
					search += " LIMIT ?, ?;";
					searchData.unshift(me[0].lat, me[0].lng, me[0].lat, me[0].id_usr);
					searchData.push(offset);
					searchData.push(nbElementOnPage);
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
						count: Math.ceil(results[0].count / nbElementOnPage)
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
