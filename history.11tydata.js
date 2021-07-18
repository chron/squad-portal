module.exports = {
  eleventyComputed: {
    scores: (data) => {
      if (!data.cycle) { return []; }
      return data.cycle.scores;
    }
  },
}
