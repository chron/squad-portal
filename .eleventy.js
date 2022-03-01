require('dotenv').config();
const formatDistance = require('date-fns/formatDistance');
const format = require('date-fns/format');
const parseISO = require('date-fns/parseISO');
const { EleventyServerlessBundlerPlugin } = require("@11ty/eleventy");
const USERS = require('./_data/users'); // TODO: better way to load this?

module.exports = function(eleventyConfig) {
  eleventyConfig.addPlugin(EleventyServerlessBundlerPlugin, {
    name: "serverless",
    functionsDir: "./netlify/functions/",
  });

  eleventyConfig.addPassthroughCopy('css');
  eleventyConfig.addPassthroughCopy({ public: '/' });

  eleventyConfig.addFilter('debug', function(input) {
    return JSON.stringify(input, null, 2);
  });

  eleventyConfig.addFilter('timedist', function(input) {
    if (!input) { return ''; }

    return formatDistance(parseISO(input), new Date)
  });

  eleventyConfig.addFilter('shortDate', function(input) {
    if (!input) { return ''; }

    return format(parseISO(input), 'MMM d');
  });

  eleventyConfig.addFilter('nickname', function(githubLogin) {
    return USERS.find(u => u.githubLogin === githubLogin)?.nickname || githubLogin;
  });

  eleventyConfig.addNunjucksAsyncShortcode('avatar', async function(userName) {
    if (!userName) { return ''; }

    // input.avatar is the URL of their github avatar, but those are kinda boring?
    const avatarUrl = `https://avatars.dicebear.com/api/bottts/${userName}.svg`;

    return `<img src="${avatarUrl}" alt="Avatar of ${userName}">`;
  });

  return {
    passthroughFileCopy: true,
  }
}
