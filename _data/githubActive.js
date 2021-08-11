const sortBy = require('lodash.sortby');
const Cache = require("@11ty/eleventy-cache-assets");

const query = `
  query {
    search(query: "org:storypark is:pr is:open SLOW- NOT combo in:title", type: ISSUE, first: 100) {
      nodes {
        ... on PullRequest {
          title
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
const ON_STAGING = '5. On StagingAU';

// Merge conflict, Combo, 0. Early Feedback Requested, , 6. Ready for deploy to prod

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

  const prs = githubResponse.data.search.nodes.map((node) => {
    const titleMatch = node.title.match(/^\s*\[?(SLOW[- ]\w+)\]?\s*(?:-\s*)?(.+)$/i);

    return {
      title: titleMatch ? titleMatch[2] : node.title,
      jira: titleMatch && titleMatch[1].toUpperCase().replace(/\s+/, '-'),
      author: { name: node.author.login, avatar: node.author.avatarUrl },
      assigned: node.reviews.nodes.map(r => ({ name: r.author.login, avatar: r.author.avatarUrl })),
      labels: node.labels.nodes.map(n => n.name),
      lastLabelChange: node.timelineItems.nodes[0]?.createdAt,
      size: `+${node.additions} -${node.deletions}`,
    };
  });

  return {
    needReviewers: prs.filter(pr => pr.labels.includes(READY_TO_REVIEW) && pr.assigned.length < 2),
    notOnStaging: prs.filter(pr => pr.labels.includes(READY_TO_TEST) && !pr.labels.includes(ON_STAGING)),
    inTest: prs.filter(pr => pr.labels.includes(READY_TO_TEST) && pr.labels.includes(ON_STAGING) && pr.assigned.length > 0),
  }
}
