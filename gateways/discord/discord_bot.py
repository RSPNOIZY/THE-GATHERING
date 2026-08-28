import discord
import sys
from pathlib import Path
from discord.ext import commands

# Monorepo path resolution
sys.path.append(str(Path(__file__).resolve().parent.parent.parent))
try:
    from core.orchestration.agent_orchestrator import AgentSwarm
except ModuleNotFoundError:
    from agent_orchestrator import AgentSwarm

# Setup Discord Intents
intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)
swarm = AgentSwarm()

@bot.event
async def on_ready():
    print(f'Discord Bot logged in as {bot.user} - Army is ready!')

@bot.command()
async def army(ctx, *, prompt: str):
    await ctx.send("The noisy army is thinking...")
    response = await swarm.process_request(prompt)
    await ctx.send(response)

if __name__ == "__main__":
    bot.run("YOUR_DISCORD_BOT_TOKEN")