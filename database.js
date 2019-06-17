const mariadb = require('mariadb');
require('require-sql');
const createDB = require('./createDB.sql');


const pool = mariadb.createPool({
    host: 'localhost',
    user:'root',
    password: '',
    port: '3306',
    // connectionLimit: 5
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