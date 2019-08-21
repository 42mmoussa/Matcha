const mariadb = require('mariadb');
const keys = require('./keys');
const ent = require('ent');

const pool = mariadb.createPool({
  host: 'localhost',
  user: keys.mariadb.user,
  password: keys.mariadb.password,
  port: '3306',
});

function sanitize(string) {
	return ent.encode(string);
}

function sanitizeInputForXSS(req, res, next) {
	let queryKeys = Object.keys(req.query);
	let paramKeys = Object.keys(req.params);
	queryKeys.forEach(key => {
		req.query[key] = sanitize(req.query[key]);
	});
	paramKeys.forEach(key => {
		req.params[key] = sanitize(req.params[key]);
	});

	next();
}

function checkuid(username) {
	var regex = /^[a-zA-Z0-9]+$/;

	return regex.test(username);
}

function checkemail(email) {
	var regex = /^[a-z0-9._-]+@[a-z0-9._-]{2,}\.[a-z]{2,4}$/;

	return regex.test(email);
}

function checkname(name) {
	var regex = /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u;

	return regex.test(name);
}

function checkpwd(pwd) {
	var regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/;

	return regex.test(pwd);
}

function checkdate(date) {
	var regex = /^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/;

	return regex.test(date);
}

function randomString(length, chars) {
	var result = '';
	for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}

function dateDiff(dateold, datenew)
{
	var ynew = datenew.getFullYear();
	var mnew = datenew.getMonth();
	var dnew = datenew.getDate();
	var yold = dateold.getFullYear();
	var mold = dateold.getMonth();
	var dold = dateold.getDate();
	var diff = ynew - yold;
	if(mold > mnew) diff--;
	else
	{
		if(mold == mnew)
		{
			if(dold > dnew) diff--;
		}
	}
	return diff;
}

function insert(main_string, ins_string, pos) {
	if(typeof(pos) == "undefined") {
		pos = 0;
	}
	if(typeof(ins_string) == "undefined") {
		ins_string = '';
	}
	return main_string.slice(0, pos) + ins_string + main_string.slice(pos);
}

function ageToDate(age) {
  var date = new Date();
  date.setFullYear(date.getFullYear() - age);
  let strDate = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();
  return strDate;
}

module.exports = {sanitize, checkemail, checkuid, checkname, checkpwd, pool, randomString, dateDiff, checkdate, insert, ageToDate, sanitizeInputForXSS};
