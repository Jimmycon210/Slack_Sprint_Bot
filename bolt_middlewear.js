const { commands } = require('./commands.js');

/**
 * @param { AppContext } AppContext app context
 */
async function addMiddlewear(AppContext) {
    const { bolt } = AppContext

    //Slash commands
    bolt.command('/test', commands.tester)
}