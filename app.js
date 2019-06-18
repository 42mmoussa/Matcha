const express      = require('express');
const path         = require('path');
const bodyParser   = require('body-parser');
const favicon      = require('serve-favicon');
const cookieParser = require('cookie-parser');
const http         = require('http');
// const mariadb = require('mariadb');

const app = express();

const about = require('./routes/about');
const login = require('./routes/login');
const signup = require('./routes/signup');
const mod = require('./routes/mod');

// configure app

app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'));

// use middleware

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(favicon('favicon.ico'));
app.use(express.static(path.join(__dirname, 'bower_components')));


// define routes

app.use('/about', about);
app.use('/login', login);
app.use('/signup', signup);
app.use(require('./todo.js'));

// connect to database

// const pool = mariadb.createPool({
//      host: 'localhost',
//      user:'root',
//      password: '',
//      port: '3306',
//      // connectionLimit: 5
// });
//
// async function asyncFunction() {
//   let conn;
//   try {
// 	conn = await pool.getConnection();
// 	const rows = await conn.query("SHOW TABLES");
// 	console.log(rows); //[ {val: 1}, meta: ... ]
// 	const res = await conn.query("INSERT INTO myTable value (?, ?)", [1, "mariadb"]);
// 	console.log(res); // { affectedRows: 1, insertId: 1, warningStatus: 0 }
//
//   } catch (err) {
// 	throw err;
//   } finally {
// 	if (conn) return conn.end();
//   }
// }

// start the server

app.listen(8888, function () {
  console.log('ready on port 8888');
});

// http.createServer(function (req, res) {
//   res.writeHead(200, {'Content-Type': 'text/html'});
//   console.log('ready on port 8888');
//   res.write();
//   res.end();
// }).listen(8888);
