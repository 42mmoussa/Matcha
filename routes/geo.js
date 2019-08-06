const express           = require('express');
var router              = express.Router();
const iplocation		= require("iplocation").default;
const keys		        = require("./keys");

router.get('/', function (req, res) {
    var ip = (req.headers['x-forwarded-for'] || '').split(',').pop() || 
            req.connection.remoteAddress || 
            req.socket.remoteAddress || 
            req.connection.socket.remoteAddress;
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