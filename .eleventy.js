require('dotenv').config();
const formatDistance = require('date-fns/formatDistance');
const parseISO = require('date-fns/parseISO');
const Image = require("@11ty/eleventy-img");

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

  eleventyConfig.addNunjucksAsyncShortcode('avatar', async function(input) {
    if (!input) { return ''; }

    const metadata = await Image(input.avatar, {
      widths: [80],
      formats: ['png'],
      outputDir: './_site/img/',
    });

    const imageAttributes = {
      alt: `Avatar of ${input.name}`,
      sizes: [40],
      loading: "lazy",
      decoding: "async",
    };

    return Image.generateHTML(metadata, imageAttributes);
  });

  return {
    passthroughFileCopy: true,
  }
}
