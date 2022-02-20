const fetch = require('node-fetch');
const cookie = require('cookie');

const GITHUB_ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';

// TODO: DRY this with the one in login.js
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
  const cookies = cookie.parse(event.headers.cookie);
  const { code, state } = event.queryStringParameters;

  if (cookies._weka_oauth_csrf !== state) {
    throw new Error("Missing or invalid CSRF token.");
  }

  const response = await fetch(GITHUB_ACCESS_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
    }),
  });

  const token = await response.json();

  console.log(JSON.stringify({
    client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
    client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
    code,
  }));

  if (token.error) {
    return {
      statusCode: 403,
      body: 'Some kinda auth error.',
    };
  }

  return {
    statusCode: 302,
    headers: {
      Location: '/leaderboard', // TODO: carry this through the redirect
      'Cache-Control': 'no-cache',
    },
    multiValueHeaders: {
      'Set-Cookie': [
        getCookie("_weka_oauth_token", token.auth_token, 60 * 60 * 10),
        getCookie("_weka_oauth_csrf", "", -1),
      ]
    },
  }
}
