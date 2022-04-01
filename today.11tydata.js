module.exports = {
  eleventyComputed: {
    githubActiveFiltered: (data) => (data.helpers.processPRData(data)),
  },
}
