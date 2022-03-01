const fetch = require('node-fetch');

const query = `
  query {
    search(query: "org:storypark is:pr is:open NOT combo in:title SLOW- OR GIRA- OR WEKA-", type: ISSUE, first: 100) {
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

const EARLY_FEEDBACK = '0. Early Feedback Requested';
const READY_TO_REVIEW = '1. Ready for code review';
const READY_TO_TEST = '3. Ready for testing';
const READY_TO_RELEASE = '6. Ready for deploy to prod';
const ON_STAGING = '5. On StagingAU';
const COMBO = 'Combo';
//const MERGE_CONFLICT = 'Merge conflict';

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
    const titleMatch = node.title.match(/^\s*\[?((?:SLOW|GIRA|WEKA)[- ][^ \]]+)\]?\s*(?:[:-]\s*)?(.+)$/i);

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

  return [
    {
      title: 'Pull requests that could use some early feedback',
      prs: prs.filter(pr => pr.labels.includes(EARLY_FEEDBACK)),
      classification: 'review',
      showReviewStatus: true,
    },
    {
      title: 'Pull requests that need more reviewers',
      prs: prs.filter(pr => pr.labels.includes(READY_TO_REVIEW) && pr.assigned.length < 2),
      classification: 'review',
      showReviewStatus: true,
    },
    {
      title: 'Pull requests that are being reviewed',
      prs: prs.filter(pr => pr.labels.includes(READY_TO_REVIEW) && pr.assigned.length >= 2),
      classification: 'review',
      showReviewStatus: true,
    },
    // TODO: PRs that have changes requested? Right now we only show accepted reviews
    {
      title: 'Pull requests in test that haven\'t made it to staging',
      prs: prs.filter(pr => pr.labels.includes(READY_TO_TEST) && !(pr.labels.includes(ON_STAGING) || pr.labels.includes(COMBO))),
      classification: 'test',
    },
    {
      title: 'Pull requests that are being tested',
      prs: prs.filter(pr => !pr.labels.includes(READY_TO_REVIEW) && (((pr.labels.includes(READY_TO_TEST) && pr.labels.includes(ON_STAGING)) || pr.labels.includes(COMBO)) && pr.assigned.length > 0)),
      classification: 'test',
    },
    {
      title: 'Ready to go out in next release',
      prs: prs.filter(pr => pr.labels.includes(READY_TO_RELEASE)),
      classification: 'finished',
    },
    // other?
  ];
}
