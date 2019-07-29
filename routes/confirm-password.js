var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
	return res.render('confirm-password', {
	});
});

module.exports = router;
