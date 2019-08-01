const express      = require('express');
const app          = express();
const path         = require('path');
const bodyParser   = require('body-parser');
const favicon      = require('serve-favicon');
const cookieParser = require('cookie-parser');
const session      = require('express-session');
const server       = require('http').createServer(app);
const passport     = require('passport');

const TWO_HOURS    = 1000 * 60 * 60 * 2;
const TWO_DAYS    = 1000 * 60 * 60 * 48;

const {
  PORT             = 8888,
  NODE_ENV         = 'development',

  SESS_SECRET      = 'ssh!quiet,it\'sasecret',
  SESS_NAME        = 'sid',
  SESS_LIFETIME    = TWO_DAYS
} = process.env

const IN_PROD      = NODE_ENV === 'production';

const profile      = require('./routes/profile');
const settings     = require('./routes/settings');
const login        = require('./routes/login');
const signup       = require('./routes/signup');
const mod          = require('./routes/mod');
const index        = require('./routes/index');
const swipe        = require('./routes/swipe');
const matchat      = require('./routes/matchat');
const resetpasswd  = require('./routes/reset-password');
const changepasswd = require('./routes/change-password');
const notifications = require('./routes/notifications');
const pictures      = require('./routes/change-picture');

// configure app

app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'));

// use middleware

app.use('/img', express.static('img'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(favicon('img/favicon.ico'));
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
app.use(passport.initialize());
app.use(passport.session());


// define routes

app.use('/change-picture', pictures);
app.use('/notifications', notifications);
app.use('/change-password', changepasswd);
app.use('/reset-password', resetpasswd);
app.use('/profile', profile);
app.use('/settings', settings);
app.use('/login', login);
app.use('/signup', signup);
app.use('/swipe', swipe);
app.use('/matchat', matchat);
app.use('/', index);

// start socket

socket = require('./routes/socket')(server);

// start the server

server.listen(PORT, function () {
  console.log('ready : http://localhost:8888');
});
