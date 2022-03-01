const cookie = require('cookie');

module.exports.createCookie = function(name, value, expiration) {
  let options = {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: '/',
    maxAge: expiration,
  };

  return cookie.serialize(name, value, options);
}
