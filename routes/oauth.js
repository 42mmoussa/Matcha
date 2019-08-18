const passport = require('passport');
const google = require('passport-google-oauth20');
const keys = require('./keys');
const mod = require('./mod');

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    mod.pool.getConnection()
    .then(conn => {
        conn.query("USE matcha")
        .then(() => {
            return conn.query("SELECT * FROM users WHERE id_usr=?", [user.id_usr]);
        })
        .then(row => {
            conn.end();
            let data = row[0];
            data.googleID = user.googleID;
            return done(null, row[0]);
        })
        .catch(err => {
            conn.end();
            console.log(err);
        })
    })
    .catch(err => {
        console.log(err);
    })
});

passport.use(
    new google({
        //options for google start
        callbackURL:'/login/google/redirect',
        clientID: keys.google.clientID,
        clientSecret: keys.google.clientSecret
    }, (accessToken, refreshToken, profile, done) => {
        // passport callback function
        userEmail = profile.emails[0].value;
        googleID = profile.id;
        firstName = profile.name.givenName;
        lastName = profile.name.familyName;
        username = firstName + lastName;
        birthday = new Date();

        mod.pool.getConnection()
        .then(conn => {
            conn.query("USE matcha")
            .then(() => {
                return conn.query("SELECT * FROM users WHERE googleID=?", [googleID])
            })
            .then((row) => {
                if (row.length != 0) {
                    let data = row[0];
                    data.googleID = googleID;
                    throw {type: 'login', data: data};
                }
                return conn.query("SELECT * FROM users WHERE email=?", [userEmail])
            })
            .then((row) => {
                if (row.length != 0) {
                    let data = row[0];
                    data.googleID = googleID;
                    throw {type: 'login', data: data};
                }
                let queryUname = "%" + username + "%";
                return conn.query('SELECT * FROM `users` WHERE `username` LIKE ?', [queryUname]);
            })
            .then((row) => {
                console.log(row.length);
                if (row.length != 0) {
                    let verif = 0;
                    numberVerif = 0;
                    while (verif === 0) {
                        console.log(numberVerif);
                        ++numberVerif;
                        i = -1;
                        verif = 1;
                        while (++i < row.length) {
                            if (row[i].username == username + numberVerif) {
                                verif = 0;
                            }
                        }
                    }
                    username = username + numberVerif;
                    console.log(username);
                }
            })
            .then(() => {
                conn.query("INSERT INTO users(googleID, firstname, lastname, username, pwd, email, confirm, birthday) VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
                [googleID, firstName, lastName, username, "unmotdepasse", userEmail, 1, birthday]);
                return conn.query("SELECT * FROM users WHERE username = ?", [username]);
            })
            .then(row => {
                throw {type: 'login', data: row[0]};
            })
			.catch(err => {
                conn.end();
                if (err.type === "login")
                    done(null, err.data);
			})
        })
        .catch(err => {
            conn.end();
            console.log(err);
        })
    })
);