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
        const ltDiscussion = discussions.find(discussion => discussion.title.startsWith('LT Weekly Update'));
        if (ltDiscussion) {
            const { data: comments } = await octokit.rest.discussions.listComments({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                discussion_number: ltDiscussion.number,
            });
            const firstComment = comments[0];
            const commentBody = firstComment.body.split('\n');
            const keyUpdatesIndex = commentBody.findIndex(line => line.startsWith('### Key Updates and Progress'));
            if (keyUpdatesIndex !== -1) {
                let listStartIndex = commentBody.findIndex((line, index) => index > keyUpdatesIndex && (line.startsWith('- ') || line.startsWith('* ')));
                if (listStartIndex === -1) {
                    listStartIndex = keyUpdatesIndex + 1;
                    commentBody.splice(listStartIndex, 0, '- ' + text);
                } else {
                    while (commentBody[listStartIndex + 1] && commentBody[listStartIndex + 1].startsWith('- ')) {
                        listStartIndex++;
                    }
                    commentBody.splice(listStartIndex + 1, 0, '- ' + text);
                }
                await octokit.rest.discussions.updateComment({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    discussion_number: ltDiscussion.number,
                    comment_number: firstComment.number,
                    body: commentBody.join('\n'),
                });
            }
        }
    }
}

run().catch(error => core.setFailed(error.message));