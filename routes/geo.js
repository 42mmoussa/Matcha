const express           = require('express');
var router              = express.Router();
const iplocation		= require("iplocation").default;
const keys		        = require("./keys");
const mod				= require('./mod');

router.get('/', function (req, res) {
    if (req.session.connect) {
        var ip = (req.headers['x-forwarded-for'] || '').split(',').pop() || 
                req.connection.remoteAddress || 
                req.socket.remoteAddress || 
                req.connection.socket.remoteAddress;
    
        
        mod.pool.getConnection()
        .then(conn => {
            conn.query("USE matcha")
            .then(() => {
                return conn.query("SELECT * FROM profiles;")
            })
            .then((row) => {
                iplocation(ip, [], (error, res1) => {
                    let location = res1;                   
                    conn.end();
                    return res.render('geo', {
                        users: row,
                        ip: ip,
                        location: location,
                        key: keys.google.key
                    });
                });
            })
            .catch(err => {
                console.log(err);
                conn.end();
                return res.render("/maps");
            });
        });
    } else {
        return res.redirect("/login")
    }
});

module.exports = router;