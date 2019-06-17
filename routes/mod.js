function checkuid($username) {
  var usernameRegex = /^[a-zA-Z0-9]+$/;
  
  return usernameRegex.exec($username);
}

module.exports = {checkuid};
