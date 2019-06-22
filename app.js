const express      = require('express');
const path         = require('path');
const bodyParser   = require('body-parser');
const favicon      = require('serve-favicon');
const cookieParser = require('cookie-parser');
const session      = require('express-session');
const http         = require('http');

const TWO_HOURS    = 1000 * 60 * 60 * 2;

const {
  PORT             = 8888,
  NODE_ENV         = 'development',

  SESS_SECRET      = 'ssh!quiet,it\'sasecret',
  SESS_NAME        = 'sid',
  SESS_LIFETIME    = TWO_HOURS
} = process.env

const IN_PROD      = NODE_ENV === 'production';

const app = express();

const user = require('./routes/user');
const about = require('./routes/about');
const login = require('./routes/login');
const signup = require('./routes/signup');
const mod = require('./routes/mod');
const index = require('./routes/index');
<<<<<<< HEAD
const user = require('./routes/user');
=======
const swipe = require('./routes/swipe');
>>>>>>> mmoussa

// configure app

app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'));

// use middleware

app.use('/img', express.static('img'));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(favicon('favicon.ico'));
app.use(express.static(path.join(__dirname, 'bower_components')));
  // session
app.use(session({
  name: SESS_NAME,
  resave: false,
  saveUninitialized: false,
  secret: SESS_SECRET,
  cookie: {
    maxAge: SESS_LIFETIME,
    sameSite: true,
    secure: IN_PROD
  }
}));
app.use(function(req, res, next) {
  res.locals.session = req.session;
  next();
});


// define routes

app.use('/user', user);
app.use('/about', about);
app.use('/login', login);
app.use('/signup', signup);
<<<<<<< HEAD
app.use('/', index);
app.use('/user', user);

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
=======
app.use('/swipe', swipe);
app.use('/', index);
>>>>>>> mmoussa

// start the server

app.listen(PORT, function () {
  console.log('ready on port 8888');
});
