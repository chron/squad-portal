const fetch = require('node-fetch');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
const { createCookie } = require('./lib/cookies.js');

const GITHUB_ACCESS_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_USER_ORG_URL = 'https://api.github.com/user/orgs';

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

  const responseJson = await response.json();

  if (responseJson.error) {
    return {
      statusCode: 403,
      body: 'Some kinda auth error.',
    };
  }

  const orgResponse = await fetch(GITHUB_USER_ORG_URL, {
    headers: {
      Authorization: `token ${responseJson.access_token}`,
      Accept: 'application/json',
    },
  });
  const orgJson = await orgResponse.json();

  if (!orgJson.find(org => org.login === 'storypark')) {
    return {
      statusCode: 403,
      body: 'Account must be part of the storypark org on Github.',
    };
  }

  // Right now just the presence of the (signed) JWT is enough to auth a user.
  // In future we could do more fine grained auth stuff like checking which teams
  // a user is in, etc.
  const token = jwt.sign({}, process.env.JWT_SECRET, { expiresIn: '1d' });

  return {
    statusCode: 302,
    headers: {
      Location: '/leaderboard', // TODO: carry this through the redirect
      'Cache-Control': 'no-cache',
    },
    multiValueHeaders: {
      'Set-Cookie': [
        createCookie("_weka_oauth_token", token, 60 * 60 * 24),
        createCookie("_weka_oauth_csrf", "", -1),
      ]
    },
  }
}
