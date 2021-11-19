const sortBy = require('lodash.sortby');
const Cache = require("@11ty/eleventy-cache-assets");

const query = `
  query {
    search(query: "org:storypark is:pr review:approved", type: ISSUE, last: 100) {
      nodes {
        ... on PullRequest {
          createdAt
          author {
            login
          }
          reviews(states: APPROVED, first: 5) {
            nodes {
              createdAt
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

const CUTOFF = new Date('2011-11-07');
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

  const prAuthors = githubResponse.data.search.nodes.map(node => {
    if (Date.parse(node.createdAt) < CUTOFF) return null;
    return node.author.login;
  }).filter(Boolean);

  const allReviews = githubResponse.data.search.nodes.flatMap(node => {
    return node.reviews.nodes.map(innerNode => {
      if (Date.parse(innerNode.createdAt) < CUTOFF) return null;
      return innerNode.author.login;
    }).filter(Boolean);
  });

  const uniqueAuthors = [...new Set(prAuthors.concat(allReviews))];

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
