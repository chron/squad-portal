const ourConstants = require('./constants');

module.exports.processPRData = (data) => {
  const prs = data.githubActive;

  return [
    {
      title: 'Pull requests that could use some early feedback',
      prs: prs.filter(pr => pr.labels.includes(ourConstants.EARLY_FEEDBACK)),
      classification: 'review',
      showReviewStatus: true,
    },
    {
      title: 'Pull requests that need more reviewers',
      prs: prs.filter(pr => pr.labels.includes(ourConstants.READY_TO_REVIEW) && pr.assigned.length < 2),
      classification: 'review',
      showReviewStatus: true,
    },
    {
      title: 'Pull requests that are being reviewed',
      prs: prs.filter(pr => pr.labels.includes(ourConstants.READY_TO_REVIEW) && pr.assigned.length >= 2),
      classification: 'review',
      showReviewStatus: true,
    },
    // TODO: PRs that have changes requested? Right now we only show accepted reviews
    {
      title: 'Pull requests in test that haven\'t made it to staging',
      prs: prs.filter(pr => pr.labels.includes(ourConstants.READY_TO_TEST) && !(pr.labels.includes(ourConstants.ON_STAGING) || pr.labels.includes(ourConstants.COMBO))),
      classification: 'test',
    },
    {
      title: 'Pull requests that are being tested',
      prs: prs.filter(pr => !pr.labels.includes(ourConstants.READY_TO_REVIEW) && (((pr.labels.includes(ourConstants.READY_TO_TEST) && pr.labels.includes(ourConstants.ON_STAGING)) || pr.labels.includes(ourConstants.COMBO)) && pr.assigned.length > 0)),
      classification: 'test',
    },
    {
      title: 'Ready to go out in next release',
      prs: prs.filter(pr => pr.labels.includes(ourConstants.READY_TO_RELEASE)),
      classification: 'finished',
    }
    // other?
  ];
};

module.exports.addProgressStatusToPRs = (prs, person) => {
  return prs.map(pr => {
    const updatedPR = {...pr};
    console.log(ourConstants);
    if (updatedPR.author.name === person.githubLogin) {
      updatedPR.progressStatus = 'authored';
    } else if (updatedPR.labels.includes(ourConstants.READY_TO_RELEASE)) {
      updatedPR.progressStatus = 'finished';
    } else if (updatedPR.labels.includes(ourConstants.READY_TO_TEST)) {
      updatedPR.progressStatus = 'test';
    } else if (updatedPR.labels.includes(ourConstants.READY_TO_REVIEW) && updatedPR.assigned.filter(assignee => assignee.hasReviewed).length < 2) {
      updatedPR.progressStatus = 'pendingOthers';
    } else if (updatedPR.labels.includes(ourConstants.READY_TO_REVIEW)) {
      updatedPR.progressStatus = 'review';
    } else {
      // Fallback
      updatedPR.progressStatus = 'WAT';
    }
    return updatedPR;
  });
};

module.exports.emojiForStatus = (status) => {
  switch (status) {
    case 'authored': return "📝";
    case 'finished': return "✅";
    case 'pendingOthers': return "🤔";
    case 'review': return "🔍";
    case 'test': return "🧪";
    case 'WAT': return "🤷‍♂️";
    default: return "";
  }
}
