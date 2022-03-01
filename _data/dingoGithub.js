const fetch = require('node-fetch');

const query = `
  query {
    search(query: "is:open is:pr repo:storypark/families-ios repo:storypark/education-ios repo:components-ios repo:families-android repo:storypark-android", type: ISSUE, first: 100) {
      nodes {
        ... on PullRequest {
          repository {
            name
          }
          title
          bodyText
          url
          createdAt
          merged
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
  const githubResponse = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
    },
    body: JSON.stringify({ query }),
  });
  const githubJson = await githubResponse.json();

  if (!githubJson.data) {
    console.error(githubJson);
  }

  const prs = githubJson.data.search.nodes.map((node) => {
    const titleMatch = node.title.match(/^\s*(DNG[- ][^ :]+)\s*(?:[:-]\s*)?(.+)$/i);

    return {
      repo: node.repository.name,
      title: titleMatch ? titleMatch[2] : node.title,
      url: node.url,
      jira: titleMatch && titleMatch[1].toUpperCase().replace(/\s+/, '-'),
      author: { name: node.author.login, avatar: node.author.avatarUrl },
      reviewers: node.reviews.nodes.map(r => ({ name: r.author.login, avatar: r.author.avatarUrl })),
      assigned: node.assignees.nodes.map(a => ({ name: a.login, avatar: a.avatarUrl, hasReviewed: node.reviews.nodes.some(n => n.author.login === a.login) })),
      labels: node.labels.nodes.map(n => n.name),
      lastLabelChange: node.timelineItems.nodes[0]?.createdAt,
      size: `+${node.additions} -${node.deletions}`,
      merged: node.merged,
      status: node.commits.nodes[0]?.commit.status?.state.toLowerCase(),
    };
  });

  const repos = [...new Set(prs.map(p => p.repo))];
  return repos.map(r => ({
    title: r,
    classification: 'review',
    showReviewStatus: true,
    prs: prs.filter(p => p.repo === r)
  }));
}
