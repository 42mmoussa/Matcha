const mariadb = require('mariadb');

function checkuid($username) {
  var usernameRegex = /^[a-zA-Z0-9]+$/;
  
  return usernameRegex.exec($username);
}

const pool = mariadb.createPool({
  host: 'localhost',
  user:'root',
  password: '',
  port: '3306',
  // connectionLimit: 5
});

function randomString(length, chars) {
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

module.exports = {checkuid, pool, randomString};

