const express = require('express');
const router = express.Router();
const mod = require('./mod');
const uniqid = require('uniqid');

router.get('/', function(req, res) {
	if (req.session.connect) {	
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

			let search = "SELECT * FROM (SELECT id_usr, firstname, lastname, username, gender, birthday, orientation, pictures, tags, lat, lng, "+
						distCalc + " As Dist"+
						" FROM profiles) as res" +
						" WHERE res.id_usr != ?"+
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

            let tabTags = profile[0].tags.split(",");
            tabTags.pop();

            if (tabTags.length > 0) {
				tabTags.forEach(function (element) {
                    search += " OR res.tags LIKE ?";
                    searchData.push("%" + element + ",%");
                    searchCol.push("tags");
                });
			}

			search += ")";

			let first = 0;
			if (searchCol.length > 0) {
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
						}
					}
					first++;
                });
                search += " + IF (res.Dist < 1 , 400, 0)"+
                    " + IF (res.Dist < 5 , 200, 0)"+
                    " + IF (res.Dist < 7 , 100, 0)"+
                    " + IF (res.Dist < 10 , 25, 0)"+
                    ") DESC;";
			}
            searchData.unshift(profile[0].lat, profile[0].lng, profile[0].lat, profile[0].id_usr);
            console.log(search + " | " + searchData);
            
			return conn.query(search, searchData);
		}).then((row) => {
            conn.end();
			if (row.length === 0) {
				return res.render('suggestion', {
					popupTitle: 'Swipe',
					popupMsg: 'We\'ve found no one',
					popup: true
				});
            }
			return res.render('suggestion', {
				nbUsers: row.length,
				users: row
			});
		})
		.catch(err => {
			console.log(err);
            conn.end();
            return res.redirect("/")
		});
	}).catch(err => {
		//not connected
	});
	} else {
		return res.redirect('/');
	}
});

module.exports = router;
