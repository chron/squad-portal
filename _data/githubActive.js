const sortBy = require('lodash.sortby');
const Cache = require("@11ty/eleventy-cache-assets");

const query = `
  query {
    search(query: "org:storypark is:pr is:open SLOW- NOT combo in:title", type: ISSUE, first: 100) {
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
            avatarUrl(size: 50)
          }
          reviews(states: APPROVED, first: 5) {
            nodes {
              author {
                login
                avatarUrl(size: 50)
              }
            }
          }
          assignees(first: 5) {
            nodes {
              login
              avatarUrl(size: 50)
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
        }
      }
    }
  }
`;

const READY_TO_REVIEW = '1. Ready for code review';
const READY_TO_TEST = '3. Ready for testing';
const READY_TO_RELEASE = '6. Ready for deploy to prod';
const ON_STAGING = '5. On StagingAU';

// Merge conflict, Combo, 0. Early Feedback Requested, ,

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
    const titleMatch = node.title.match(/^\s*\[?(SLOW[- ]\w+)\]?\s*(?:-\s*)?(.+)$/i);

    return {
      title: titleMatch ? titleMatch[2] : node.title,
      url: node.url,
      jira: titleMatch && titleMatch[1].toUpperCase().replace(/\s+/, '-'),
      author: { name: node.author.login, avatar: node.author.avatarUrl },
      reviewers: node.reviews.nodes.map(r => ({ name: r.author.login, avatar: r.author.avatarUrl })),
      assigned: node.assignees.nodes.map(a => ({ name: a.login, avatar: a.avatarUrl })),
      labels: node.labels.nodes.map(n => n.name),
      lastLabelChange: node.timelineItems.nodes[0]?.createdAt,
      size: `+${node.additions} -${node.deletions}`,
    };
  });

  return [
    {
      title: 'Pull requests that need more reviewers',
      prs: prs.filter(pr => pr.labels.includes(READY_TO_REVIEW) && pr.assigned.length < 2),
    },
    {
      title: 'Pull requests that are being reviewed',
      prs: prs.filter(pr => pr.labels.includes(READY_TO_REVIEW) && pr.assigned.length >= 2),
    },
    {
      title: 'Pull requests in test that haven\'t made it to staging',
      prs: prs.filter(pr => pr.labels.includes(READY_TO_TEST) && !pr.labels.includes(ON_STAGING)),
    },
    {
      title: 'Pull requests that are being tested',
      prs: prs.filter(pr => pr.labels.includes(READY_TO_TEST) && pr.labels.includes(ON_STAGING) && pr.assigned.length > 0),
    },
    {
      title: 'Ready to go out in next release',
      prs: prs.filter(pr => pr.labels.includes(READY_TO_RELEASE)),
    },
    // other?
  ];
}
