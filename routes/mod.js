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

module.exports = {checkuid, pool};

