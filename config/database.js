const mariadb = require('mariadb');
require('require-sql');
const createDB      = require('./sql/createDB.sql');
const confirm       = require('./sql/confirm.sql');
const profiles      = require('./sql/profiles.sql');
const lst_users     = require('./sql/lst_users.sql');
const lst_profiles  = require('./sql/lst_profiles.sql');
const tags          = require('./sql/tags.sql');
const likes         = require('./sql/likes.sql');
const dislikes      = require('./sql/dislikes.sql');
const favorites     = require('./sql/favorites.sql');
const messages      = require('./sql/messages.sql');
const matchat       = require('./sql/matchat.sql');
const notifications = require('./sql/notifications.sql');
const keys          = require('../routes/keys.js');

const pool = mariadb.createPool({
    host: 'localhost',
    user: keys.mariadb.user,
    password: keys.mariadb.password,
    port: '3306'
});

pool.getConnection()
   .then(conn => {

     conn.query("CREATE DATABASE IF NOT EXISTS matcha;")
       .then(() => {
         return conn.query("USE matcha");
       })
       .then(() => {
         conn.query(createDB);
         conn.query(confirm);
         conn.query(profiles);
         conn.query(lst_users);
         conn.query(lst_profiles);
         conn.query(tags);
         conn.query(likes);
         conn.query(dislikes);
         conn.query(favorites);
         conn.query(messages);
         conn.query(matchat);
         conn.query(notifications)
		 .then(() => {
			conn.end();
			process.exit(console.log("New database created successfully\n"));
		 });
       })
       .catch(err => {
         //handle error
         console.log(err);
         conn.end();
       })

   }).catch(err => {
     console.log(err);
   });
