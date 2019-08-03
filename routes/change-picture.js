const express = require('express');
const mod = require('./mod');
const crypto = require('crypto-js');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

var router = express.Router();

router.get('/', function(req, res) {
	if (req.session.connect) {
		return res.render('change-picture', {
		});
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
		var path_pp =  "img/" + req.session.user.id;

		if (!fs.existsSync('img')) {
		fs.mkdirSync('img');
		}
		if (!fs.existsSync(path_pp)) {
		fs.mkdirSync(path_pp);
		}

		var Storage = multer.diskStorage({
		destination: function(req, file, callback) {
			callback(null, path_pp);
		},
		filename: function(req, file, callback) {
			callback(null, "profile.jpg");
		}
		});

		if (path.extname(req.files.path).toLowerCase() === ".png") {
			var upload = multer({
			storage: Storage
			}).array("imgUploader", 3);
		}
		else {
			res.render('change-picture', {
				popupTitle: "Image",
				popupMsg: "Only .png files are accepted",
				popup: true
			});
		}
	}
	if (req.session.connect) {
		upload(req, res, function(err) {
		if (err) {
			console.log(err);
			return res.end("err");
		}
		mod.pool.getConnection()
		.then((conn) => {
			conn.query("USE matcha;")
			.then(() => {
				conn.query("UPDATE profiles SET pictures = pictures + 10 WHERE id_usr = ?;", [req.session.user.id]);
			});
			conn.end();
		});
		return res.redirect("/profile");
		});
	}
});

module.exports = router;
