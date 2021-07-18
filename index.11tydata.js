module.exports = {
  eleventyComputed: {
    scores: (data) => {
      if (!data.github) { return []; }
      return data.github;
    }
  },
}
