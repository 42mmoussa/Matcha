const mariadb = require('mariadb');
require('require-sql');
const createDB = require('./sql/createDB.sql');
const confirm = require('./sql/confirm.sql');
const profiles = require('./sql/profiles.sql');
const lst_users = require('./sql/lst_users.sql');
const lst_profiles = require('./sql/lst_profiles.sql');

const pool = mariadb.createPool({
    host: 'localhost',
    user:'atelli',
    password: '123456',
    port: '3306'
});

pool.getConnection()
   .then(conn => {

     conn.query("CREATE DATABASE IF NOT EXISTS matcha;")
       .then((rows) => {
         console.log(rows); //[ {val: 1}, meta: ... ]
         //Table must have been created before
         // " CREATE TABLE myTable (id int, val varchar(255)) "
         return conn.query("USE matcha");
       })
       .then((res) => {
         console.log(res); //\
         conn.query(createDB);
         conn.query(confirm);
         conn.query(profiles);
         conn.query(lst_users);
         conn.query(lst_profiles);
         conn.end();
       })
       .catch(err => {
         //handle error
         console.log(err);
         conn.end();
       })

   }).catch(err => {
     //not connected
   });