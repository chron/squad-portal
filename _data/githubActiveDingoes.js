const sortBy = require('lodash.sortby');
const Cache = require("@11ty/eleventy-cache-assets");

const query = `
  query {
    search(query: "org:storypark is:pr label:dingoes NOT combo", type: ISSUE, first: 100) {
      nodes {
        ... on PullRequest {
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

const EARLY_FEEDBACK = '0. Early Feedback Requested';
const READY_TO_REVIEW = '1. Ready for code review';
const READY_TO_TEST = '3. Ready for testing';
const READY_TO_RELEASE = '6. Ready for deploy to prod';
const ON_STAGING = '5. On StagingAU';
const COMBO = 'Combo';

function prState(pr) {
  if (pr.merged) return 'released';
  if (pr.labels.includes(EARLY_FEEDBACK)) return 'early_feedback';
  if (pr.labels.includes(READY_TO_REVIEW) && pr.assigned.length < 2) return 'needs_reviewers';
  if (pr.labels.includes(READY_TO_REVIEW) && pr.assigned.length >= 2) return 'being_reviewed';
  if (pr.labels.includes(READY_TO_TEST) && !(pr.labels.includes(ON_STAGING) || pr.labels.includes(COMBO))) return 'waiting_for_staging_deploy';
  if (!pr.labels.includes(READY_TO_REVIEW) && (((pr.labels.includes(READY_TO_TEST) && pr.labels.includes(ON_STAGING)) || pr.labels.includes(COMBO)) && pr.assigned.length > 0)) return 'in_test';
  if (pr.labels.includes(READY_TO_RELEASE)) return 'ready_for_release';

  return 'unknown';
}

module.exports = async function() {
  const githubResponse = await Cache('https://api.github.com/graphql?cache=githubActiveDingoes', {
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
    const titleMatch = node.title.match(/^\s*\[?((?:SLOW|GIRA)[- ].+?)\]?\s*(?:[:-]\s*)?(.+)$/i);
    const noteMatch = node.bodyText.match(/\[dingoes\](.+?)\[\/dingoes\]/i);

    const pr = {
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
      notes: noteMatch ? noteMatch[1] : null,
    };

    return {
      ...pr,
      state: prState(pr),
    };
  });

  return prs;
}
