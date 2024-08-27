require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const cron = require('node-cron');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: ['CHANNEL'] // This is necessary to receive DMs
});

let standupResponses = {};

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    cron.schedule('* * * * *', async () => { // Adjust the time as needed
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        if (guild) {
            const members = await guild.members.fetch();

            members.forEach(member => {
                if (!member.user.bot) { // Exclude bots
                    member.send('Good morning! Time for the daily standup. Please answer the following:\n1. What did you do yesterday?\n2. What are you doing today?\n3. Any blockers?').then(() => {
                        standupResponses[member.id] = [];
                    }).catch(console.error);
                }
            });
        }
    });
});

client.on('messageCreate', message => {
    if (message.guild === null && standupResponses[message.author.id]) { // If it's a DM
        standupResponses[message.author.id].push(message.content);

        if (standupResponses[message.author.id].length === 3) {
            message.channel.send('Thank you for completing your standup!');
            sendToChannel(message.author, standupResponses[message.author.id]);
            delete standupResponses[message.author.id];
        } else {
            message.channel.send(`Please provide your answer to question ${standupResponses[message.author.id].length + 1}:`);
        }
    }
});

function sendToChannel(user, responses) {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    const channel = guild.channels.cache.get(process.env.CHANNEL_ID);

    if (channel) {
        channel.send(`**Daily Standup for ${user.username}:**\n1. ${responses[0]}\n2. ${responses[1]}\n3. ${responses[2]}`);
    }
}

client.login(process.env.BOT_TOKEN);