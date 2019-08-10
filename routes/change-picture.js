const express = require('express');
const mod = require('./mod');
const crypto = require('crypto-js');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

var router = express.Router();


router.get('/', function(req, res) {
	if (req.session.connect) {
		id = req.query.id;
		if (id === undefined)
			id = req.session.user.id;
		mod.pool.getConnection()
		.then((conn) => {
			conn.query("USE matcha")
			.then(() => {
				return conn.query("SELECT * FROM profiles WHERE id_usr = ?", id)
			})
			.then((rows) => {
				if (rows[0]) {
					conn.end();
					return res.render('change-picture', {
						firstname: rows[0].firstname,
						lastname: rows[0].lastname,
						username: rows[0].username,
						id: rows[0].id_usr,
						age: rows[0].age,
						orientation: rows[0].orientation.charAt(0).toUpperCase() + rows[0].orientation.slice(1),
						gender: rows[0].gender.charAt(0).toUpperCase() + rows[0].gender.slice(1),
						bio: rows[0].bio,
						pic: rows[0].pictures,
						tags: rows[0].tags
					});
				} else {
					conn.end();
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
	}
	else {
		return res.render('login', {
			popupTitle: "Login",
			popupMsg: "Please login",
			popup: true
		});
	}
})

router.post('/upload', function (req, res) {
	if (req.session.connect) {
		var deleteFolderRecursive = function(path) {
			if( fs.existsSync(path) ) {
			  fs.readdirSync(path).forEach(function(file,index){
				var curPath = path + "/" + file;
				if(fs.lstatSync(curPath).isDirectory()) { // recurse
				  deleteFolderRecursive(curPath);
				} else { // delete file
				  fs.unlinkSync(curPath);
				}
			  });
			  fs.rmdirSync(path);
			}
		};
		function checkFileType(file, cb){
			// Allowed ext
			const filetypes = /jpeg|jpg|png|gif/;
			// Check ext
			const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
			// Check mime
			const mimetype = filetypes.test(file.mimetype);
		
			if(mimetype && extname){
			return cb(null,true);
			} else {
				if (!fs.existsSync("img/" + req.session.user.id)) {
					deleteFolderRecursive("img/" + req.session.user.id);
					mod.pool.getConnection()
					.then((conn) => {
						conn.query("USE matcha;")
						.then(() => {
							conn.query("UPDATE profiles SET pictures = 0 WHERE id_usr = ?;", [req.session.user.id]);
						});
						conn.end();
					});
				}
				cb('Error: Images Only!');
			}
		}
		// Set The Storage Engine
		if (!fs.existsSync('img')) {
			fs.mkdirSync('img');
		}
		if (!fs.existsSync("img/" + req.session.user.id)) {
			fs.mkdirSync("img/" + req.session.user.id);
		}
		var i = 0;
		const storage = multer.diskStorage({
			destination: "img/" + req.session.user.id,
			filename: function(req, file, callback){
				if (file) {
					if (i == 0) {
						mod.pool.getConnection()
						.then((conn) => {
							conn.query("USE matcha;")
							.then(() => {
								conn.query("SELECT * FROM profiles WHERE id_usr = ?", [req.session.user.id])
								.then(rows => {
									if (rows[0].pictures == 0)
										conn.query("UPDATE profiles SET pictures = 10 WHERE id_usr = ?;", [req.session.user.id]);
								});
							});
							conn.end();
						});
						callback(null, "profile.jpg");
					}
					else {
						mod.pool.getConnection()
						.then((conn) => {
							conn.query("USE matcha;")
							.then(() => {
								conn.query("SELECT * FROM profiles WHERE id_usr = ?", [req.session.user.id])
								.then(rows => {
									if (rows[0].pictures >= 10 && rows[0].pictures < 14)
										conn.query("UPDATE profiles SET pictures = pictures + 1 WHERE id_usr = ?;", [req.session.user.id]);
								});
							});
							conn.end();
						});
						callback(null, "image" + i + ".jpg");
					}
					i++;
				}
			}
			});
			
			// Init Upload
			const upload = multer({
			storage: storage,
			limits:{fileSize: 1000000},
			fileFilter: function(req, file, cb){
				checkFileType(file, cb);
			}
			}).fields([
				{name: "image0", maxCount: 1},
				{name: "image1", maxCount: 1},
				{name: "image2", maxCount: 1},
				{name: "image3", maxCount: 1},
				{name: "image4", maxCount: 1},
			]);
			
			// Check File Type
		upload(req, res, (err) => {
			if(err){
				res.render('change-picture', {
					error: err
				});
			}
			else {
				res.redirect('/profile');
			}
		});
	}
});

module.exports = router;
