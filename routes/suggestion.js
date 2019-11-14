const express = require('express');
const router = express.Router();
const mod = require('./mod');

router.get('/', mod.sanitizeInputForXSS, function (req, res) {
    if (req.session.connect) {
      if (req.session.user.age < 18) {
        return res.redirect("/settings/change-birthdate");
      }
    	res.redirect('/suggest/1');
  	} else {
  		res.redirect('/login');
  	}
});

router.get('/:page', function(req, res) {
	if (req.session.connect) {
		if (!isNaN(req.params.page) && req.params.page > 0) {

			resUsers = [];

			let nbElementOnPage = 20;
			let page = parseInt(req.params.page, 10) - 1;
			let offset = page * nbElementOnPage;

			mod.pool.getConnection()
				.then(conn => {
				conn.query("USE matcha")
				.then(() => {
					return conn.query("SELECT * FROM profiles WHERE id_usr=?", [req.session.user.id]);
				}).then((profile) => {
					if (profile.length === 0) {
						conn.end();
						return res.redirect("/profile/create-profile");
					}
					let b = 0;

					let distCalc = "111.111 *"+
								" DEGREES(ACOS(LEAST(COS(RADIANS(lat))"+
								" * COS(RADIANS(?))"+
								" * COS(RADIANS(lng - ?))"+
								" + SIN(RADIANS(lat))"+
								" * SIN(RADIANS(?)), 1.0)))";

					let search = "SELECT COUNT(*) OVER () as count, id_usr, firstname, lastname, username, gender, birthday, orientation, pictures, tags, lat, lng, pop, Dist FROM (SELECT id_usr, firstname, lastname, username, gender, birthday, orientation, pictures, tags, lat, lng, pop, "+
								distCalc + " As Dist"+
								" FROM profiles) as res" +
								" WHERE res.id_usr != ? AND res.pictures > 0"+
								" AND (";
					let searchData = [];
					let searchCol = [];

					if (/Heterosexual/.test(profile[0].orientation)) {
						search += " (res.orientation LIKE ?"+
						" AND res.gender = ?)";
						if (profile[0].gender === 'man') {
							searchData.push("%Heterosexual%");
							searchData.push("woman");
							searchCol.push("heterosexual");
						} else {
							searchData.push("%Heterosexual%");
							searchData.push("man");
							searchCol.push("heterosexual");
						}
					}
					else if (/Homosexual/.test(profile[0].orientation))
					{
						search += " (res.orientation LIKE ?"+
						" AND res.gender = ?)";
						if (profile[0].gender === 'man') {
							searchData.push("%Homosexual%");
							searchData.push("man");
							searchCol.push("homosexual");
						}
						else {
							searchData.push("%Homosexual%");
							searchData.push("woman");
							searchCol.push("homosexual");
						}
					}
					else if (/Bisexual/.test(profile[0].orientation)) {
						search += " (res.orientation LIKE ?"+
							" AND (res.gender = ? OR res.gender = ?))";
						searchData.push("%Bisexual%");
						searchData.push("woman");
						searchData.push("man");
						searchCol.push("homosexual");
					}

					search += " OR res.Dist < 10";

					if (profile[0].tags != null) {
							let tabTags = profile[0].tags.split(",");
							tabTags.pop();

						if (tabTags.length > 0) {
							tabTags.forEach(function (element) {
								search += " OR res.tags LIKE ?";
								searchData.push("%" + element + ",%");
								searchCol.push("tags");
							});
						}
					}

					search += " OR res.pop BETWEEN ? - 100 AND ? + 100";
					searchData.push(profile[0].pop);
					searchData.push(profile[0].pop);
					searchCol.push("pop");

					search += ")";

					filterTags = req.query.tags;
					filterAge = req.query.age;
					filterPop = req.query.popularity;
					filterDist = req.query.distance;

					if (filterTags !== undefined) {
						if (typeof filterTags === "string") {
							search += " AND res.tags LIKE ?";
							searchData.push("%" + filterTags + ",%");
							searchCol.push("filterTags");
						} else {
							filterTags.forEach(function (element) {
								search += " AND res.tags LIKE ?";
								searchData.push("%" + element + ",%");
								searchCol.push("filterTags");
							});
						}
					}
					if (filterAge !== undefined && (filterAge[0] !== "18" || filterAge[1] !== "100")) {
						let from = mod.ageToDate(parseInt(filterAge[0]));
						let to = mod.ageToDate(parseInt(filterAge[1]) + 1);
						if (from > to) {
							let c = from;
							from = to;
							to = c;
						}
						search += " AND (res.birthday BETWEEN ? AND ?)";
						searchData.push(from);
						searchData.push(to);
						searchCol.push("filterBirthday");
					}
					if (filterPop !== undefined && (parseInt(filterPop[0]) != 1 || parseInt(filterPop[1]) != 500)) {
						let from = parseInt(filterPop[0]);
						let to = parseInt(filterPop[1]);
						if (from > to) {
							let c = from;
							from = to;
							to = c;
						}
						search += " AND (res.pop BETWEEN ? AND ?)";
						searchData.push(from);
						searchData.push(to);
						searchCol.push("filterPopularity");
					}
					if (filterDist !== undefined && parseInt(filterDist) < 30) {
						let maxdist = parseInt(filterDist);
						search += " AND (res.Dist < ?)";
						searchData.push(maxdist);
						searchCol.push("filterDistance");
					}
					if (profile[0].blocked_user != null) {
						blockedUsers = profile[0].blocked_user.split(',');
						blockedUsers.pop();
						blockedUsers.forEach(function(element) {
						search += " AND (res.id_usr != ?)";
						searchData.push(element);
									searchCol.push("BlockedUser");
						});
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
						} else if (order === "tags" && typeof tabTags !== 'undefined') {
							i = 0;
							tabTags.forEach(function (element) {
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
					} else if (searchCol.length > 0) {
						searchCol.forEach(function (element) {
							if (first === 0) {
								if (element === 'heterosexual' || element === 'homosexual') {
									search += " ORDER BY ( IF (res.orientation LIKE ? AND res.gender = ? , 1000, 0)";
									searchData.push(searchData[first]);
									first++;
									searchData.push(searchData[first]);
								} else if (element === 'bisexual') {
									search += " ORDER BY ( IF (res.orientation LIKE ? AND (res.gender = ? OR res.gender = ?) , 1000, 0)";
									searchData.push(searchData[first]);
									first++;
									searchData.push(searchData[first]);
									first++;
									searchData.push(searchData[first]);
								} else if (element === 'tags') {
									search += " ORDER BY ( IF (res.tags LIKE ? , 1000, 0)";
									searchData.push(searchData[first]);
								} else if (element === 'pop') {
									search += " ORDER BY ( IF (res.pop BETWEEN ? - 200 AND ? + 200 , 25, 0)";
									searchData.push(searchData[first]);
									first++;
									searchData.push(searchData[first]);
								}
							} else {
								if (element === 'heterosexual' || element === 'homosexual') {
									search += "+ IF (res.orientation LIKE ? AND res.gender = ? , 1000, 0)";
									searchData.push(searchData[first]);
									first++;
									searchData.push(searchData[first]);
								} else if (element === 'bisexual') {
									search += " + IF (res.orientation LIKE ? AND (res.gender = ? OR gender = ?) , 1000, 0)";
									searchData.push(searchData[first]);
									first++;
									searchData.push(searchData[first]);
									first++;
									searchData.push(searchData[first]);
								} else if (element === 'tags') {
									search += " + IF (res.tags LIKE ? , 10, 0)";
									searchData.push(searchData[first]);
								} else if (element === 'pop') {
									search += " + IF (res.pop BETWEEN ? - 200 AND ? + 200 , 25, 0)";
									searchData.push(searchData[first]);
									first++;
									searchData.push(searchData[first]);
								}
							}
							first++;
						});
						search += " + IF (res.Dist < 1 , 400, 0)"+
							" + IF (res.Dist < 5 , 200, 0)"+
							" + IF (res.Dist < 7 , 50, 0)"+
							") DESC";
					}
					searchData.unshift(profile[0].lat, profile[0].lng, profile[0].lat, profile[0].id_usr);
					search += " LIMIT ?, ?;";
					searchData.push(offset);
					searchData.push(nbElementOnPage);
					return conn.query(search, searchData);
				}).then((row) => {
					resUsers = row;
					return conn.query("SELECT * FROM tags ORDER BY nb_tag ASC");
				})
				.then(tags => {
					conn.end();
					if (resUsers.length === 0) {
						return res.render('suggestion', {
							tags: tags,
							nbTags: tags.length,
							popupTitle: 'Swipe',
							popupMsg: 'We\'ve found no one',
							popup: true
						});
					}
					if (resUsers.length != 0) {
						let i = -1;
						let today = new Date();
						while (++i < resUsers.length) {
							let bday = new Date(resUsers[i].birthday);
							resUsers[i].age = mod.dateDiff(bday, today);
							if (resUsers[i].tags != null) {
								resUsers[i].tags = resUsers[i].tags.replace(/,/g, ' ');
							}
						}
					}
					return res.render('suggestion', {
						tags: tags,
						nbTags: tags.length,
						nbUsers: resUsers.length,
						users: resUsers,
						page: page + 1,
						count: Math.ceil(resUsers[0].count / nbElementOnPage)
					});
				})
				.catch(err => {
					console.log(err);
					conn.end();
					return res.redirect("/suggest/1")
				});
			}).catch(err => {
				//not connected
			});
		} else {
			return res.redirect('/suggest/1');
		}
	} else {
		return res.redirect('/');
	}
});

module.exports = router;
