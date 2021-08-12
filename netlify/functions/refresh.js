const fetch = require('node-fetch');

module.exports.handler = async function(event, context) {
  if (!process.env.BUILD_HOOK_URL) {
    return {
      statusCode: 422,
      body: 'BUILD_HOOK_URL not set',
    }
  }

  await fetch(process.env.BUILD_HOOK_URL, {
    method: 'POST',
  });

  return {
    statusCode: 200,
    body: 'Refresh initiated :)',
  }
}
