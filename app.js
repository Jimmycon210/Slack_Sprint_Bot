const { App } = require('@slack/bolt');
require('dotenv').config();
require('./bolt_middlewear')
// const { env } = require('./.env');

//Init app with token and signing secret
const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});

app.command('/test', async ({ command, ack, say }) =>{
    await ack();
    await say('test command used!');
})

app.command('/sprint', async ({ ack, body, context }) =>{
    await ack();

    try {
        const result = await app.client.views.open({
            token: process.env.SLACK_BOT_TOKEN,
            trigger_id: body.trigger_id,

            view: {
                type: 'modal',
                callback_id: 'ticket_view',
            title: {
                type: 'plain_text',
                text: 'Sprint Builder',
                emoji: true
            },
            submit: {
                type: 'plain_text',
                text: 'Submit',
                emoji: true
            },
            close: {
                type: 'plain_text',
                text: 'Close',
                emoji: true
            },
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'plain_text',
                        text: 'Create your sprint below!'
                    }
                },
                {
                    type: 'divider'
                },
                {
                    type: 'input',
                    block_id: 'title_input',
                    element: {
                        type: 'plain_text_input',
                        action_id: 'title_inputted'
                    },
                    label: {
                        type: 'plain_text',
                        text: 'Sprint name',
                        emoji: true
                    }
                },
                {
                    type: 'input',
                    block_id: 'tickets_input',
                    element: {
                        type: 'plain_text_input',
                        multiline: true,
                        action_id: 'tickets_inputted'
                    },
                    label: {
                        type: 'plain_text',
                        text: 'Enter all of the tickets :ticket: below, separated by commas (", ").',
                        emoji: true,
                    }
                },
                {
                    type: 'input',
                    block_id: 'channel_input',
                    optional: true,
                    label: {
                        type: 'plain_text',
                        text: 'Select a channel to post the sprint message on!'
                    },
                    element: {
                        action_id: 'channel_inputted',
                        type: 'conversations_select',
                        response_url_enabled: true
                    }
                }
            ]
            }
        })
        console.log(result)
    } catch(error) { console.error(error); }
});

//Creates the message
app.view('ticket_view', async ({ ack, body, view, context }) => {
    await ack();
    const title_val = view['state']['values']['title_input'];
    const tickets_val = view['state']['values']['tickets_input'];
    const channel_val = view['state']['values']['channel_input'];
    const user = body['user']['id'];

    var title_str = title_val.title_inputted.value;
    var all_tickets_str = tickets_val.tickets_inputted.value;
    var channel_to_post = channel_val.channel_inputted.selected_conversation;

    var tickets = all_tickets_str.split(', ');

    var ticket_blocks = 
    [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: '*'+title_str+'*'
            }
        },
        {
            type: 'section',
            block_id: 'todo_title',
            text: {
                type: 'plain_text',
                text: ':file_folder: TODO tickets :file_folder:'
            }
        },
        {
            type: 'divider'
        }
    ];

    var overflow_menu_block = {
        accessory: {
            type: 'overflow',
            options: [

            ],
            action_id: 'move_to'
        }
    }; 

    var i;
    for(i = 0; i<tickets.length; i++) {
        //block_id ends in _t for text with button block
        var new_ticket_block = {
            type: 'section',
            block_id: 't'+i+'_t',
            text: {
                type: 'plain_text',
                text: tickets[i]
            },
            accessory: {
                type: 'button',
                action_id: 'ticket_taken',
                text: {
                    type: 'plain_text',
                    text: 'Take Ticket',
                    emoji: true
                }
            }
        };
        ticket_blocks.push(new_ticket_block);
        //block_id ends in _c for context block
        var new_conext_block = {
            type: 'context',
            block_id: 't'+i+'_c',
            elements: [
                {
                    type: 'plain_text',
                    text: 'No takers... yet!'
                }
            ]
        };
        ticket_blocks.push(new_conext_block);

        overflow_menu_block.accessory.options.push(
            {
                text: {
                    type: 'plain_text',
                    emoji: true,
                    text: 'Move '+tickets[i]+' here.'
                },
                value: 't'+i
            }
        );
    }

    ticket_blocks.push({ type: 'divider' });
    ticket_blocks.push(
        {
            type: 'section',
            block_id: 'in_prog_title',
            text: {
                type: 'mrkdwn',
                text: ':hourglass_flowing_sand: Tickets In Progress :hourglass_flowing_sand:'
            }
        }
    )
    ticket_blocks.push({ type: 'divider' });
    ticket_blocks.push(
        {
            type: 'context',
            block_id: 'in_prog_placeholder',
            elements: [{
                type: 'mrkdwn',
                text: 'Nothing here yet!'
            }]
        }
    );

    ticket_blocks.push({ type: 'divider' });
    ticket_blocks.push(
        {
            type: 'section',
            block_id: 'testing_title',
            text: {
                type: 'mrkdwn',
                text: ':computer: Tickets Being Tested :computer:'
            }
        }
    )
    ticket_blocks.push({ type: 'divider' });
    ticket_blocks.push(
        {
            type: 'context',
            block_id: 'testing_placeholder',
            elements: [{
                type: 'mrkdwn',
                text: 'Nothing here yet!'
            }]
        }
    );

    ticket_blocks.push({ type: 'divider' });
    ticket_blocks.push(
        {
            type: 'section',
            block_id: 'completed_title',
            text: {
                type: 'mrkdwn',
                text: ':white_check_mark: Tickets Completed :white_check_mark:'
            }
        }
    )
    ticket_blocks.push({ type: 'divider' });
    ticket_blocks.push(
        {
            type: 'context',
            block_id: 'completed_placeholder',
            elements: [{
                type: 'mrkdwn',
                text: 'Nothing here yet!'
            }]
        }
    );
    ticket_blocks.push({ type: 'divider' });

    for(i = 0; i<ticket_blocks.length; i++) {
        try {
            if(ticket_blocks[i].block_id.includes('_title')) {
                var overflow = Object.assign({}, overflow_menu_block.accessory);
                ticket_blocks[i].accessory = overflow;
            }
        } catch(error) {
            continue;
        }
    }

    if(channel_to_post === undefined) { channel_to_post = user; }

    await app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: channel_to_post,
        text: "Confirmed submit!",
        blocks: ticket_blocks
    });
})

const finished_placeholder = {
    type: 'context',
    elements: [{
        type: 'mrkdwn',
        text: 'No tickets in this section!'
    }]
};

app.action('ticket_taken', async({ body, ack }) => {
    await ack();
    console.log('\n\nBODY\n\n');
    console.log(body);
    console.log('\n\nBLOCKS\n\n');
    console.log(body.message.blocks);
    var updated_blocks = body.message.blocks;
    var i;
    var blocks_to_be_moved;
    for(i = 0; i<updated_blocks.length; i++) {
        if(updated_blocks[i].block_id === body.actions[0].block_id.substr(0,2)+'_t') {
            updated_blocks[i+1].elements[0].text = `Ticket taken by ${body.user.name}... In progress.`;
            blocks_to_be_moved = updated_blocks.splice(i, 2);
            if(updated_blocks[i-1].type === 'divider' && updated_blocks[i].type === 'divider') {
                placeholder = finished_placeholder;
                placeholder.block_id = 'finished_TODO_placeholder'
                updated_blocks.splice(i,0,placeholder);
            }
            break;
        }
    }
    var section_block = blocks_to_be_moved[0];
    section_block.accessory.action_id = 'move_to_testing';
    section_block.accessory.text = { type: 'plain_text', text: "Move to testing"};
    var context_block = blocks_to_be_moved[1];
    for(i = 0; i<updated_blocks.length; i++) {
        if(updated_blocks[i].block_id === 'in_prog_title') {
            if(updated_blocks[i+2].block_id === 'in_prog_placeholder' || updated_blocks[i+2].block_id === 'finished_progress_placeholder') {
                updated_blocks.splice(i+2, 1, section_block);
            } else {
                updated_blocks.splice(i+2, 0, section_block);
            }
            updated_blocks.splice(i+3, 0, context_block);
            break;
        }
    }

    await app.client.chat.update({
        token: process.env.SLACK_BOT_TOKEN,
        channel: body.container.channel_id,
        ts: body.container.message_ts,
        text: 'Confirmed submit!',
        blocks: updated_blocks
    });
});

app.action('move_to_testing', async({ body, ack }) => {
    await ack();
    updated_blocks = body.message.blocks;
    var i;
    var blocks_to_be_moved;
    for(i = 0; i<updated_blocks.length; i++) {
        if(updated_blocks[i].block_id === body.actions[0].block_id.substr(0,2)+'_t') {
            updated_blocks[i+1].elements[0].text = `Ticket finished by ${body.user.name}... In testing.`;
            blocks_to_be_moved = updated_blocks.splice(i, 2);
            if(updated_blocks[i-1].type === 'divider' && updated_blocks[i].type === 'divider') {
                placeholder = finished_placeholder;
                placeholder.block_id = 'finished_progress_placeholder'
                updated_blocks.splice(i,0,placeholder);
            }
            break;
        }
    }
    var section_block = blocks_to_be_moved[0];
    section_block.accessory.action_id = 'completed';
    section_block.accessory.text = { type: 'plain_text', text: "Complete!"};
    var context_block = blocks_to_be_moved[1];
    for(i = 0; i<updated_blocks.length; i++) {
        if(updated_blocks[i].block_id === 'testing_title') {
            if(updated_blocks[i+2].block_id === 'testing_placeholder' || updated_blocks[i+2].block_id === 'finished_testing_placeholder') {
                updated_blocks.splice(i+2, 1, section_block);
            } else {
                updated_blocks.splice(i+2, 0, section_block);
            }
            updated_blocks.splice(i+3, 0, context_block);
            break;
        }
    }

    await app.client.chat.update({
        token: process.env.SLACK_BOT_TOKEN,
        channel: body.container.channel_id,
        ts: body.container.message_ts,
        text: 'Confirmed submit!',
        blocks: updated_blocks 
    });
});

app.action('completed', async({ body, ack }) => {
    await ack();
    updated_blocks = body.message.blocks;
    var i;
    var blocks_to_be_moved;
    for(i = 0; i<updated_blocks.length; i++) {
        if(updated_blocks[i].block_id === body.actions[0].block_id.substr(0,2)+'_t') {
            updated_blocks[i+1].elements[0].text = `Ticket tested by ${body.user.name}. Completed! :tada:`;
            blocks_to_be_moved = updated_blocks.splice(i, 2);
            if(updated_blocks[i-1].type === 'divider' && updated_blocks[i].type === 'divider') {
                placeholder = finished_placeholder;
                placeholder.block_id = 'finished_testing_placeholder'
                updated_blocks.splice(i,0,placeholder);
            }
            break;
        }
    }
    var section_block = blocks_to_be_moved[0];
    section_block.accessory.action_id = 'completed';
    section_block.accessory.text = { type: 'plain_text', text: "Remove"};
    var context_block = blocks_to_be_moved[1];
    for(i = 0; i<updated_blocks.length; i++) {
        if(updated_blocks[i].block_id === 'completed_title') {
            if(updated_blocks[i+2].block_id === 'completed_placeholder') {
                updated_blocks.splice(i+2, 1, section_block);
            } else {
                updated_blocks.splice(i+2, 0, section_block);
            }
            updated_blocks.splice(i+3, 0, context_block);
            break;
        }
    }

    await app.client.chat.update({
        token: process.env.SLACK_BOT_TOKEN,
        channel: body.container.channel_id,
        ts: body.container.message_ts,
        text: 'Confirmed submit!',
        blocks: updated_blocks
    });
});

app.action('move_to', async({ body, ack }) => {
    await ack();
    console.log("\n\naction_id of title sending action:\n\n");
    console.log(body.message.blocks);
    var updated_blocks = body.message.blocks;
    const dest_title = body.actions[0].block_id;
    const ticket_moving_value = body.actions[0].selected_option.value;
    var blocks_to_be_moved;
    var i;
    for(i = 0; i<updated_blocks.length; i++) {
        if(updated_blocks[i].block_id === ticket_moving_value+'_t') {
            if(updated_blocks[i-1].type === 'divider' && updated_blocks[i+2].type === 'divider') {
                placeholder = finished_placeholder;
                placeholder.block_id = dest_title.substr(0, dest_title.indexOf('_'))+'_placeholder';
                blocks_to_be_moved = updated_blocks.splice(i, 2, finished_placeholder);
            } else {
                blocks_to_be_moved = updated_blocks.splice(i, 2);
            }
        }
    }

    var button_text; var new_action_id;
    switch(dest_title.substr(0, dest_title.indexOf('_'))) {
        case 'todo': button_text = 'Take Ticket';   new_action_id = 'ticket_taken' ;   break;
        case 'in': button_text = 'Move to testing'; new_action_id = 'move_to_testing'; break;
        case 'testing': button_text = 'Complete!';  new_action_id = 'completed';       break;
        case 'completed': button_text = 'Remove';   new_action_id = 'remove';          break;
    }
    blocks_to_be_moved[0].accessory.text.text = button_text;
    blocks_to_be_moved[0].accessory.action_id = new_action_id;
    blocks_to_be_moved[1].elements[0].text = `Moved to `+dest_title.substr(0, dest_title.indexOf('_'))+` by ${body.user.name}.`

    for(i = 0; i<updated_blocks.length; i++) {
        if(updated_blocks[i].block_id === dest_title) {
            if(updated_blocks[i+2].block_id.includes('placeholder')) {
                updated_blocks.splice(i+2, 1, blocks_to_be_moved[0], blocks_to_be_moved[1]);
            } else {
                updated_blocks.splice(i+2, 0, blocks_to_be_moved[0], blocks_to_be_moved[1]);
            }
            break;
        }
    }

    await app.client.chat.update({
        token: process.env.SLACK_BOT_TOKEN,
        channel: body.container.channel_id,
        ts: body.container.message_ts,
        text: 'Confirmed submit!',
        blocks: updated_blocks
    });
})

app.action('channel_inputted', async({ body, ack, say }) => {
    await ack();
    await say("channel_inputted action called!");
    console.log("CHANNEL SUBMIT")
});

(async() => {
    //Start app
    await app.start(process.env.PORT || 3000);
    console.log('⚡️ Bolt app is running!');
})();