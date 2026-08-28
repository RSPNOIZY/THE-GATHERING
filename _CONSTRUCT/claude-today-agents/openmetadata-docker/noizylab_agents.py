import discord
from discord.ext import commands
import platform
import psutil
import os
import asyncio
import subprocess

# 1. Base Framework Setup
intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

BOT_TOKEN = "PUT_YOUR_DISCORD_BOT_TOKEN_HERE"

# 2. Local TTS Engine (macOS Native)
def speak_kate(text):
    """Strips markdown and speaks via macOS Kate Premium voice"""
    clean = text.replace("**", "").replace("*", "").replace("_", "")
    subprocess.Popen(['say', '-v', 'Kate', clean])

# 3. LUCY - The Vocal Creative Agent
class Lucy(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="lucy_status")
    async def lucy_status(self, ctx):
        msg = "**Lucy Online:** Ready to resurrect the Recovery Era folder and guide NOIZYWORLD."
        speak_kate("Lucy Online. Ready to resurrect the Recovery Era folder and guide Noizyworld.")
        await ctx.send(msg)

    @commands.command(name="lucy_build")
    async def lucy_build(self, ctx):
        msg = "**Current Build:** Spine folder mapped. Local TTS active. Awaiting resurrection commands."
        speak_kate("Current Build: Spine folder mapped. Local Text-to-Speech active. Awaiting resurrection commands.")
        await ctx.send(msg)

# 4. GABRIEL - The System Agent (Silent Operator)
class Gabriel(commands.Cog):
    def __init__(self, bot):
        self.bot = bot

    @commands.command(name="gabriel_status")
    async def gabriel_status(self, ctx):
        await ctx.send(f"**Gabriel Online:** Monitoring M2 Ultra GOD node.\n* CPU: {psutil.cpu_percent()}%\n* RAM: {psutil.virtual_memory().percent}%")

# 5. Engine Boot Sequence
@bot.event
async def on_ready():
    print(f"[-] Dual-Agent Framework Live with Kate Premium Voice.")
    speak_kate("Sanctuary framework online. Lucy and Gabriel are listening.")

async def main():
    await bot.add_cog(Lucy(bot))
    await bot.add_cog(Gabriel(bot))
    if BOT_TOKEN == "PUT_YOUR_DISCORD_BOT_TOKEN_HERE":
        print("\n[!] TOKEN MISSING: Open noizylab_agents.py and paste your Discord BOT_TOKEN on line 14.\n")
        subprocess.Popen(['say', '-v', 'Kate', 'System halt. Please insert Discord token.'])
    else:
        await bot.start(BOT_TOKEN)

if __name__ == "__main__":
    asyncio.run(main())
