const sortBy = require('lodash.sortby');
const Cache = require("@11ty/eleventy-cache-assets");

const query = `
  query {
    search(query: "org:storypark is:pr created:>2021-08-01 SLOW- NOT combo in:title", type: ISSUE, first: 100) {
      nodes {
        ... on PullRequest {
          author {
            login
          }
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

module.exports = async function scores() {
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

  const prAuthors = githubResponse.data.search.nodes.map(node => node.author.login);
  const uniqueAuthors = [...new Set(prAuthors)];
  const allReviews = githubResponse.data.search.nodes.flatMap(node => node.reviews.nodes.map(innerNode => innerNode.author.login));

  const reviewCounts = allReviews.reduce((accum, username) => {
    return {
      ...accum,
      [username]: (accum[username] || 0) + 1,
    };
  }, {});

  const sortedAuthors = sortBy(uniqueAuthors, u => -reviewCounts[u]);

  return sortedAuthors.map((user) => {
    return {
      user,
      reviewCount: reviewCounts[user] || 0,
      prCount: prAuthors.filter(u => u === user).length
    };
  });
}
