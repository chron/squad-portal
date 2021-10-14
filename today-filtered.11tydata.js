module.exports = {
  eleventyComputed: {
    title: (data) => {
      return `Today for ${data.user.nickname}`;
    },
    githubActiveFiltered: (data) => {
      return data.githubActive.map((category) => {
        console.log(category);
        return {
          ...category,
          prs: category.prs.filter(pr => {
            // Show my PRs, any PR needing more reviewers, or anything I'm assigned to
            return pr.author.name === data.user.githubLogin ||
              pr.assigned.some(assignee => assignee.name === data.user.githubLogin) ||
              (pr.classification === 'review' && !pr.reviewers.some(reviewer => reviewer.name === data.user.githubLogin));
          })
        };
      });
    },
  },
}
