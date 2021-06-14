const sortBy = require('lodash.sortby');
const Cache = require("@11ty/eleventy-cache-assets");

const query = `
  query {
    search(query: "org:storypark is:pr created:>2021-06-07 SLOW- in:title", type: ISSUE, first: 100) {
      nodes {
        ... on PullRequest {
          reviews(states: APPROVED, first: 5) {
            nodes {
              author {
                login
              }
            }
          }
        }
      }
    }
  }
`;

module.exports = async function reviews() {
  const githubResponse = await Cache('https://api.github.com/graphql', {
    duration: "1h",
    type: 'json',
    fetchOptions: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      },
      body: JSON.stringify({ query })
    }
  });

  const allReviews = githubResponse.data.search.nodes.flatMap(node => node.reviews.nodes.map(innerNode => innerNode.author.login));

  const reviewCounts = allReviews.reduce((accum, username) => {
    return {
      ...accum,
      [username]: (accum[username] || 0) + 1,
    };
  }, {});

  return sortBy(Object.entries(reviewCounts), u => -u[1]);
}
