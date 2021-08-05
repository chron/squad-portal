require('dotenv').config();

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('css');
  eleventyConfig.addPassthroughCopy({ public: '/' });

  eleventyConfig.addFilter('debug', function(input) {
    return JSON.stringify(input, null, 2);
  });

  return {
    passthroughFileCopy: true,
  }
}
