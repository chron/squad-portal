const sortBy = require('lodash.sortby');
const Cache = require("@11ty/eleventy-cache-assets");

const query = `
  query {
    search(query: "org:storypark is:pr is:open NOT combo", type: ISSUE, first: 100) {
      nodes {
        ... on PullRequest {
          title
          url
          createdAt
          additions
          deletions
          labels(first: 10) {
            nodes {
              name
            }
          }
          author {
            login
            avatarUrl(size: 80)
          }
          reviews(states: APPROVED, first: 5) {
            nodes {
              author {
                login
                avatarUrl(size: 80)
              }
            }
          }
          assignees(first: 5) {
            nodes {
              login
              avatarUrl(size: 80)
            }
          }
          timelineItems(last: 30, itemTypes: [LABELED_EVENT]) {
            nodes {
              __typename
              ... on LabeledEvent {
                createdAt
                label {
                  name
                }
              }
            }
          }
          commits(last: 1) {
            nodes {
              commit {
                status {
                  state

                  contexts {
                    state
                    targetUrl
                    description
                    context
                  }
                }
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
      body: JSON.stringify({ query }),
    }
  });

  if (!githubResponse.data) {
    console.error(githubResponse);
  }

  const prs = githubResponse.data.search.nodes.map((node) => {
    const titleMatch = node.title.match(/^\s*\[?((?:SLOW|GIRA|WEKA|RURU)[- ][^ \]]+)\]?\s*(?:[:-]\s*)?(.+)$/i);

    return {
      title: titleMatch ? titleMatch[2] : node.title,
      url: node.url,
      jira: titleMatch && titleMatch[1].toUpperCase().replace(/\s+/, '-'),
      author: { name: node.author.login, avatar: node.author.avatarUrl },
      reviewers: node.reviews.nodes.map(r => ({ name: r.author.login, avatar: r.author.avatarUrl })),
      assigned: node.assignees.nodes.map(a => ({ name: a.login, avatar: a.avatarUrl, hasReviewed: node.reviews.nodes.some(n => n.author.login === a.login) })),
      labels: node.labels.nodes.map(n => n.name),
      lastLabelChange: node.timelineItems.nodes[0]?.createdAt,
      size: `+${node.additions} -${node.deletions}`,
      status: node.commits.nodes[0]?.commit.status?.state.toLowerCase(),
    };
  });

  return prs;
}
