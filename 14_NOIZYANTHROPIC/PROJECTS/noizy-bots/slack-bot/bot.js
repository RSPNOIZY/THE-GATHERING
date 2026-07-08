require('dotenv').config();
const { App } = require('@slack/bolt');
const axios = require('axios');

// Initialize the Slack App
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000
});

const HEAVEN_URL = process.env.HEAVEN_URL || 'https://heaven.noizy.ai';

(async () => {
  try {
    await app.start();
    console.log('──────────────────────────────────────────────────');
    console.log('🔥 NOIZY SLACK BOT: AWAKENED (SOCKET MODE)');
    console.log('🚀 Local Hub "GABRIEL" is connected to Slack.');
    console.log(`🔗 Heaven Gateway: ${HEAVEN_URL}`);
    console.log('──────────────────────────────────────────────────');
  } catch (error) {
    console.error('❌ Failed to start NOIZY Slack Bot:', error);
  }
})();

app.command('/noizy', async ({ command, ack, say }) => {
  await ack();
  console.log(`⚡ Command /noizy triggered by ${command.user_name}: "${command.text}"`);

  await say({
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*🌌 HEAVEN GATEWAY SIGNAL RECEIVED*\nProcessing query: _${command.text}_`
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "📍 *Status:* Routing to Dreamchamber..."
          }
        ]
      }
    ]
  });
});

app.event('app_mention', async ({ event, say }) => {
  console.log(`🤖 App mention from ${event.user}`);
  
  await say({
    text: `NOIZY is listening, <@${event.user}>. How shall we expand the Dreamchamber today?`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `👋 *NOIZY.AI ACTIVE*\nGreetings <@${event.user}>. Your local hub (GABRIEL) is online.\n\n*Available Commands:*\n• \`/noizy [task]\` - Execute agentic workflow\n• Mention me with a question.`
        }
      }
    ]
  });
});

app.message(async ({ message, say }) => {
  if (message.files && message.files.length > 0) {
    const audioFiles = message.files.filter(f => f.mimetype.startsWith('audio/'));
    if (audioFiles.length > 0) {
      console.log(`🎙️ Voice file detected in Slack channel`);
      await say(`🎙️ *Voice Signal Ingested:* NOIZY is analyzing the audio stream...`);
    }
  }
});
