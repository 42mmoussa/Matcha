const mariadb = require('mariadb');

const pool = mariadb.createPool({
  host: 'localhost',
  user:'root',
  password: '',
  port: '3306',
});

function checkuid(username) {
  var regex = /^[a-zA-Z0-9]+$/;

  return regex.test(username);
}

function checkname(name) {
  var regex = /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u;

  return regex.test(name);
}

function checkpwd(pwd) {
  var regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/;

  return regex.test(pwd);
}

function randomString(length, chars) {
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

module.exports = {checkuid, checkname, checkpwd, pool, randomString};
