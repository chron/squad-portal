const cookie = require('cookie');

const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_SCOPES = 'read:org';
const REDIRECT_URI = 'http://localhost:8888/.netlify/functions/callback';

function getCookie(name, value, expiration) {
  let options = {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: '/',
    maxAge: expiration,
  };

  return cookie.serialize(name, value, options)
}

module.exports.handler = async function(event, context) {
  const csrfToken = Math.random();
  const url = `${GITHUB_OAUTH_URL}?client_id=${process.env.GITHUB_OAUTH_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${GITHUB_SCOPES}&state=${csrfToken}`;

  return {
    statusCode: 302,
    headers: {
      Location: url,
      'Set-Cookie': getCookie("_weka_oauth_csrf", csrfToken, 120), // seconds
      'Cache-Control': 'no-cache',
    },
  }
}
