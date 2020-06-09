/*
 * @typedef {import("@slack/bolt").SlackCommandMiddlewareArgs & import("@slack/bolt").Context & import("@slack/bolt").NextMiddleware} Args
 */

/**
 * @param { Args } args bolt args
 */
async function tester(args) {
    const { ack, respond } = args;
    ack();
    respond(
        {
            text: 'Test command works!'
        }
    );
}

module.exports = tester