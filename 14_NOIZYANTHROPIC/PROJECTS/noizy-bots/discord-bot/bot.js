require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const HEAVEN_URL = process.env.HEAVEN_URL || 'https://heaven.noizy.ai';

client.once('ready', () => {
    console.log('──────────────────────────────────────────────────');
    console.log('🔥 NOIZY DISCORD BOT: AWAKENED');
    console.log(`🚀 Logged in as ${client.user.tag}`);
    console.log(`🔗 Heaven Gateway: ${HEAVEN_URL}`);
    console.log('──────────────────────────────────────────────────');
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // --- VOICE MESSAGE REACTION ---
    if (message.attachments.some(a => a.contentType?.startsWith('audio/'))) {
        console.log(`🎙️ Voice signal detected from ${message.author.username}`);
        await message.react('🎙️');
        
        const embed = new EmbedBuilder()
            .setColor('#00f2ff')
            .setTitle('🎙️ Voice Signal Ingested')
            .setDescription('NOIZY is processing your audio stream. Signal routing to HEAVEN...')
            .setFooter({ text: 'Dreamchamber Agentic Flow' })
            .setTimestamp();

        message.reply({ embeds: [embed] });
    }

    // --- COMMAND HANDLING ---
    if (message.content.startsWith('!noizy')) {
        const query = message.content.replace('!noizy', '').trim();
        if (!query) return message.reply('Specify a query for the Heaven gateway.');

        console.log(`⚡ Query: "${query}"`);
        await message.react('⚡');

        try {
            const responseEmbed = new EmbedBuilder()
                .setColor('#00f2ff')
                .setTitle('🌌 Heaven Response')
                .setDescription(`Query: *${query}*\n\n[ Agentic logic processing... ]`)
                .addFields({ name: 'Status', value: 'Signal Stable', inline: true })
                .setTimestamp();

            message.reply({ embeds: [responseEmbed] });
        } catch (error) {
            console.error('❌ Heaven connection failed:', error.message);
            message.reply('⚠️ Connection to HEAVEN failed. Check infrastructure health.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
