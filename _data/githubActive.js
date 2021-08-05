const sortBy = require('lodash.sortby');
const Cache = require("@11ty/eleventy-cache-assets");

const query = `
  query {
    search(query: "org:storypark is:pr is:open SLOW- in:title", type: ISSUE, first: 100) {
      nodes {
        ... on PullRequest {
          title
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

module.exports = async function() {
  const githubResponse = await Cache('https://api.github.com/graphql?cache=githubActive', {
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

  return githubResponse.data.search.nodes.map((node) => {
    return {
      title: node.title,
      author: node.author.login,
      reviewers: node.reviews.nodes.map(r => r.author.login),
    };
  });
}
