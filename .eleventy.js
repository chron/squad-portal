require('dotenv').config();

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('css');
  eleventyConfig.addPassthroughCopy({ public: '/' });

  return {
    passthroughFileCopy: true,
  }
}
