const { createCookie } = require('./lib/cookies.js');

const GITHUB_OAUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_SCOPES = 'read:org';
const REDIRECT_URI = 'http://localhost:8888/.netlify/functions/callback';

module.exports.handler = async function(event, context) {
  const csrfToken = Math.random();

  const queryString = [
    `client_id=${process.env.GITHUB_OAUTH_CLIENT_ID}`,
    `redirect_uri=${REDIRECT_URI}`,
    `scope=${GITHUB_SCOPES}`,
    `state=${csrfToken}`,
  ].join('&');
  const url = `${GITHUB_OAUTH_URL}?${queryString}`;

  return {
    statusCode: 302,
    headers: {
      Location: url,
      'Set-Cookie': createCookie("_weka_oauth_csrf", csrfToken, 120), // seconds
      'Cache-Control': 'no-cache',
    },
  }
}
