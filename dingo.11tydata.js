module.exports = {
  eleventyComputed: {
    githubActiveFiltered: (data) => {
      return data.dingoGithub;
    },
  },
}
