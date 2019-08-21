const express           = require('express');
var router              = express.Router();
const iplocation		= require("iplocation").default;
const keys		        = require("./keys");
const mod				= require('./mod');
const getIP = require('external-ip')();

router.get('/', function (req, res) {
    if (req.session.connect) {
        if (req.session.user.age < 18) {
            return res.redirect("/settings/change-birthdate");
        }
        ip = getIP((err, ip) => {
            if (err) {
                // every service in the list has failed
                throw err;
            }
            mod.pool.getConnection()
            .then(conn => {
                conn.query("USE matcha")
                .then(() => {
                    return conn.query("SELECT * FROM profiles;")
                })
                .then((row) => {
                    iplocation(ip, [], (error, res1) => {
                        let location = res1;
                        if (location.latitude !== null && location.longitude !== null) {
                            conn.query("UPDATE profiles SET lat = ?, lng = ? where id_usr = ?;", [location.latitude, location.longitude, req.session.user.id]);
                        }
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
        });


    } else {
        return res.redirect("/login")
    }
});

router.post('/update-location', function (req, res) {
    if (req.session.connect) {
        lat = req.body.lat;
        lng = req.body.lng;
        mod.pool.getConnection()
        .then(conn => {
            conn.query("USE matcha")
            .then(() => {
                conn.query("UPDATE profiles SET lat = ?, lng = ? where id_usr = ?;", [lat, lng, req.session.user.id]);
                conn.end();
                return res.send("updated");
            });
        });
    } else {
        return res.redirect("/login");
    }
});

router.post('/ip-location', function (req, res) {
    if (req.session.connect) {

        getIP((err, ip) => {
            mod.pool.getConnection()
            .then(conn => {
                conn.query("USE matcha")
                .then(() => {
                    iplocation(ip, [], (error, res1) => {
                        let location = res1;
                        if (location.latitude !== null && location.longitude !== null) {
                            conn.query("UPDATE profiles SET lat = ?, lng = ? where id_usr = ?;", [location.latitude, location.longitude, req.session.user.id]);
                        }
                        res.send("ip-location: success");
                    });
                })
            });
        });
    } else {
        return res.redirect("/login")
    }
});

module.exports = router;
