module.exports = {
    eleventyComputed: {
      wipData: (data) => {
        const prs = data.githubActive;

        return data.users.map((person) => {
          const authoredPRs = prs.filter(pr => {
            return pr.author.name === person.githubLogin;
          });
          const reviewingPRs = prs.filter(pr => {
            return pr.assigned.some(assignee => assignee.name === person.githubLogin && !assignee.hasReviewed) &&
              pr.labels.includes(data.constants.READY_TO_REVIEW);
          });
          const reviewingOtherPRs = prs.filter(pr => {
            return pr.assigned.some(assignee => assignee.name === person.githubLogin && assignee.hasReviewed) &&
            pr.labels.includes(data.constants.READY_TO_REVIEW);
          });
          const testingPRs = prs.filter(pr => {
            return pr.assigned.some(assignee => assignee.name === person.githubLogin && assignee.hasReviewed) &&
            pr.labels.includes(data.constants.READY_TO_TEST);
          });
          const allPrs = data.helpers.addProgressStatusToPRs([...authoredPRs, ...reviewingPRs, ...reviewingOtherPRs, ...testingPRs], person);
          return {
            githubLogin: person.githubLogin,
            nickname: person.nickname,
            authoredPRs: authoredPRs,
            reviewingPRs: reviewingPRs,
            reviewingOtherPRs:reviewingOtherPRs,
            testingPRs: testingPRs,
            allPrs: allPrs,
          };
        }).filter(person => person.allPrs.length > 0).sort((a, b) => {
          return a.nickname.localeCompare(b.nickname);
        });
      },
    },
  }
