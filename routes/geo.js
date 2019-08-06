const express           = require('express');
var router              = express.Router();
var ip                  = require("ip").address();
const iplocation		= require("iplocation").default;
const keys		        = require("./keys");


router.get('/', function (req, res) {
    iplocation(ip, [], (error, res1) => {
        let location = res1.city;
        return res.render('geo', {
            ip: ip,
            location: location,
            key: keys.google.key
        });
    });
});

module.exports = router;