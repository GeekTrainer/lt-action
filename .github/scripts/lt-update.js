const github = require('@actions/github');
const core = require('@actions/core');

async function run() {
  const issueComment = github.context.payload.comment;
  const command = '#lt-update';
  if (issueComment.body.startsWith(command)) {
    const text = issueComment.body.slice(command.length).trim();
    const octokit = github.getOctokit(core.getInput('github-token'));
    const { data: discussions } = await octokit.rest.discussions.listForRepo({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      direction: 'desc',
      sort: 'created',
    });
    const ltDiscussion = discussions.find(discussion => discussion.title.startsWith('LT'));
    if (ltDiscussion) {
      await octokit.rest.discussions.createComment({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        discussion_number: ltDiscussion.number,
        body: text,
      });
    }
  }
}

run().catch(error => core.setFailed(error.message));