require('dotenv').config();
const formatDistance = require('date-fns/formatDistance');
const parseISO = require('date-fns/parseISO');

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('css');
  eleventyConfig.addPassthroughCopy({ public: '/' });

  eleventyConfig.addFilter('debug', function(input) {
    return JSON.stringify(input, null, 2);
  });

  eleventyConfig.addFilter('timedist', function(input) {
    if (!input) { return ''; }

    return formatDistance(parseISO(input), new Date)
  });

  eleventyConfig.addFilter('avatar', function(input) {
    if (!input) { return ''; }

    return `<img class="avatar__image" src="${input.avatar}" alt="Avatar of ${input.name}" />`;
  });

  return {
    passthroughFileCopy: true,
  }
}
