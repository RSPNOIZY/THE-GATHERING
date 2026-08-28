import os
import asyncio
import sys
from pathlib import Path
from slack_bolt.async_app import AsyncApp
from slack_bolt.adapter.socket_mode.async_handler import AsyncSocketModeHandler

# Monorepo path resolution
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
try:
    from core.orchestration.agent_orchestrator import AgentSwarm
except ModuleNotFoundError:
    from agent_orchestrator import AgentSwarm

# Initialize the Slack Async App
app = AsyncApp(token=os.environ.get("SLACK_BOT_TOKEN"))
swarm = AgentSwarm()

@app.message(".*")
async def handle_message(message, say):
    text = message.get("text")
    
    # Acknowledge receipt
    await say("Deploying the army to handle your request...")
    
    # Process with the agent swarm
    response = await swarm.process_request(text)
    
    # Send final response
    await say(response)

async def main():
    handler = AsyncSocketModeHandler(app, os.environ.get("SLACK_APP_TOKEN"))
    await handler.start_async()

if __name__ == "__main__":
    asyncio.run(main())