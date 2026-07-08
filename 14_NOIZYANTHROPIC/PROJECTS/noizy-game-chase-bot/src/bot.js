const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes } = require('discord.js');
const db = require('./db');
const { CONFIG, getOrCreateHunter, addPoints, calcPoints, formatTier, leaderboardEmbed, drivesEmbed } = require('./helpers');
const commands = require('./commands');

const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
]});

client.once('ready', async () => {
  console.log(`\n🎮 MASSIVE GAME CHASE DOWN — Online as ${client.user.tag}`);
  console.log(`📡 Guild: ${CONFIG.guildId || 'Not Set'}`);

  if (CONFIG.token && CONFIG.clientId && CONFIG.guildId) {
    const rest = new REST({ version: '10' }).setToken(CONFIG.token);
    try {
      await rest.put(
        Routes.applicationGuildCommands(CONFIG.clientId, CONFIG.guildId),
        { body: commands }
      );
      console.log('✅ Slash commands registered successfully');
    } catch (err) {
      console.error('❌ Command registration failed:', err);
    }
  } else {
    console.warn('⚠️ Missing configuration details (DISCORD_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID). Skipping command registration.');
  }

  // Post initial leaderboard to channel if guild config is present
  if (CONFIG.guildId) {
    try {
      const guild = await client.guilds.fetch(CONFIG.guildId);
      const lbChannel = guild.channels.cache.find(c => c.name === CONFIG.channels.leaderboard);
      if (lbChannel) {
        await lbChannel.send({ embeds: [leaderboardEmbed(), drivesEmbed()] });
      }
    } catch (e) {
      console.warn('⚠️ Could not post initial leaderboard to channel:', e.message);
    }
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;
  const hunter = getOrCreateHunter(user.id, user.username, interaction.member?.displayName);

  // ── /join ──────────────────────────────────────────────────────────────────
  if (commandName === 'join') {
    const embed = new EmbedBuilder()
      .setTitle('🎮 WELCOME TO THE GAME CHASE DOWN, HUNTER')
      .setDescription(
        `**${hunter.display_name || hunter.username}** is now registered.\n\n` +
        `Your mission: Scan drives. Catalog audio. Earn points. Find the hidden gems.\n\n` +
        `📋 **888 Fish Music titles** across **10 drives / 46TB** await.\n` +
        `Use \`/claim\` to grab a drive. Use \`/log\` to record every find.\n` +
        `Rare formats = bonus points. Complete metadata = bonus points. Be thorough.`
      )
      .setColor(0xFF6B00)
      .addFields(
        { name: '🏆 Your Points', value: String(hunter.points || 0),      inline: true },
        { name: '📁 Files Found', value: String(hunter.files_found || 0),   inline: true },
        { name: '💾 Drives Owned', value: String(hunter.drives_owned || 0),  inline: true },
      )
      .setFooter({ text: 'NOIZY.AI / NOI-29 Archive Mission' });
    await interaction.reply({ embeds: [embed] });
  }

  // ── /claim ─────────────────────────────────────────────────────────────────
  else if (commandName === 'claim') {
    const driveId = interaction.options.getString('drive').toUpperCase();
    const drive = db.prepare('SELECT * FROM drives WHERE drive_id = ?').get(driveId);

    if (!drive) {
      return interaction.reply({ content: `❌ Drive **${driveId}** not found. Use /drives to see all.`, ephemeral: true });
    }
    if (drive.status !== 'unclaimed') {
      const owner = drive.claimed_by
        ? db.prepare('SELECT display_name, username FROM hunters WHERE discord_id=?').get(drive.claimed_by)
        : null;
      return interaction.reply({ content: `❌ **${driveId}** is already ${drive.status} by ${owner?.display_name || owner?.username || 'someone'}.`, ephemeral: true });
    }

    db.prepare(`UPDATE drives SET status='active', claimed_by=?, claimed_at=CURRENT_TIMESTAMP WHERE drive_id=?`)
      .run(user.id, driveId);
    db.prepare('UPDATE hunters SET drives_owned = drives_owned + 1 WHERE discord_id=?').run(user.id);
    addPoints(user.id, CONFIG.points.firstOnDrive);

    const embed = new EmbedBuilder()
      .setTitle(`💾 DRIVE CLAIMED — ${driveId}`)
      .setDescription(
        `**${hunter.display_name || hunter.username}** has claimed **${drive.label}** (${drive.capacity}).\n\n` +
        `+${CONFIG.points.firstOnDrive} pts for being first on this drive.\n` +
        `Start scanning and use \`/log\` to record every audio file you find.`
      )
      .setColor(0x00BFFF)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  // ── /log ───────────────────────────────────────────────────────────────────
  else if (commandName === 'log') {
    const driveId   = interaction.options.getString('drive').toUpperCase();
    const filename  = interaction.options.getString('filename');
    const format    = interaction.options.getString('format');
    const size_mb   = interaction.options.getNumber('size_mb') || null;
    const sample_rate = interaction.options.getString('sample_rate') || null;
    const bit_depth = interaction.options.getString('bit_depth') || null;
    const title     = interaction.options.getString('title') || null;
    const artist    = interaction.options.getString('artist') || null;
    const year      = interaction.options.getString('year') || null;
    const bpm       = interaction.options.getString('bpm') || null;
    const key_sig   = interaction.options.getString('key') || null;
    const is_fish   = interaction.options.getBoolean('is_fish') ? 1 : 0;
    const notes     = interaction.options.getString('notes') || null;

    const drive = db.prepare('SELECT * FROM drives WHERE drive_id = ?').get(driveId);
    if (!drive) return interaction.reply({ content: `❌ Drive **${driveId}** not found.`, ephemeral: true });
    if (drive.status === 'unclaimed') return interaction.reply({ content: `❌ Claim **${driveId}** first with /claim.`, ephemeral: true });

    const findData = { format, sample_rate, bit_depth, title, artist, year, bpm, key_sig, is_fish_title: is_fish };
    const pts = calcPoints(findData);

    const result = db.prepare(`
      INSERT INTO finds (hunter_id, drive_id, filename, format, size_mb, sample_rate, bit_depth,
                         title, artist, year, bpm, key_sig, is_fish_title, points_earned, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user.id, driveId, filename, format, size_mb, sample_rate, bit_depth,
           title, artist, year, bpm, key_sig, is_fish, pts, notes);

    addPoints(user.id, pts);
    db.prepare('UPDATE hunters SET files_found = files_found + 1 WHERE discord_id=?').run(user.id);
    db.prepare('UPDATE drives SET files_found = files_found + 1 WHERE drive_id=?').run(driveId);

    // Streak handling
    let streak = db.prepare('SELECT * FROM session_streaks WHERE hunter_id=?').get(user.id);
    if (!streak) {
      db.prepare('INSERT INTO session_streaks (hunter_id, current_streak) VALUES (?,1)').run(user.id);
      streak = { current_streak: 1 };
    } else {
      db.prepare('UPDATE session_streaks SET current_streak = current_streak + 1 WHERE hunter_id=?').run(user.id);
      streak.current_streak++;
    }

    let streakBonus = 0;
    if (streak.current_streak === 3)  { streakBonus = CONFIG.points.streak3;  addPoints(user.id, streakBonus); }
    if (streak.current_streak === 10) { streakBonus = CONFIG.points.streak10; addPoints(user.id, streakBonus); }

    const tier = formatTier(format);
    const updatedHunter = db.prepare('SELECT * FROM hunters WHERE discord_id=?').get(user.id);

    const embed = new EmbedBuilder()
      .setTitle(`📁 FIND LOGGED — #${result.lastInsertRowid}`)
      .setDescription(`**${filename}**\nDrive: ${driveId} | ${tier}`)
      .setColor(CONFIG.formats.rare.includes(format.toLowerCase().replace('.','')) ? 0xFF0000 : 0x00FF88)
      .addFields(
        { name: '💰 Points Earned', value: `+${pts}${streakBonus ? ` (+${streakBonus} STREAK BONUS!)` : ''}`, inline: true },
        { name: '🏆 Total Points',  value: `${updatedHunter.points.toLocaleString()}`,                          inline: true },
        { name: '📊 Streak',        value: `${streak.current_streak} finds`,                                    inline: true },
      );

    if (title || artist)  embed.addFields({ name: '🎵 Track Info', value: [title, artist, year].filter(Boolean).join(' / '), inline: false });
    if (sample_rate || bit_depth) embed.addFields({ name: '🎚 Spec', value: `${sample_rate || '?'}Hz / ${bit_depth || '?'}bit`, inline: true });
    if (is_fish)          embed.addFields({ name: '🐟 Fish Music Title!', value: `+${CONFIG.points.fisherTitle} pts`, inline: true });

    embed.setFooter({ text: `Find ID: ${result.lastInsertRowid} | Use /hiddengem <id> if RSP confirms rare` });
    await interaction.reply({ embeds: [embed] });
  }

  // ── /complete ──────────────────────────────────────────────────────────────
  else if (commandName === 'complete') {
    const driveId = interaction.options.getString('drive').toUpperCase();
    const drive = db.prepare('SELECT * FROM drives WHERE drive_id=?').get(driveId);

    if (!drive || drive.claimed_by !== user.id) {
      return interaction.reply({ content: `❌ You don't own **${driveId}** or it doesn't exist.`, ephemeral: true });
    }
    if (drive.status === 'complete') {
      return interaction.reply({ content: `✅ **${driveId}** is already marked complete.`, ephemeral: true });
    }

    db.prepare(`UPDATE drives SET status='complete', completed_at=CURRENT_TIMESTAMP WHERE drive_id=?`).run(driveId);
    addPoints(user.id, CONFIG.points.driveComplete);

    const filesOnDrive = db.prepare('SELECT COUNT(*) as c FROM finds WHERE drive_id=?').get(driveId)?.c || 0;
    const updatedHunter = db.prepare('SELECT * FROM hunters WHERE discord_id=?').get(user.id);

    const embed = new EmbedBuilder()
      .setTitle(`✅ DRIVE COMPLETE — ${driveId}`)
      .setDescription(
        `**${hunter.display_name || hunter.username}** has fully scanned **${drive.label}**.\n\n` +
        `📁 ${filesOnDrive} files cataloged | +${CONFIG.points.driveComplete} pts completion bonus\n` +
        `🏆 New total: **${updatedHunter.points.toLocaleString()} pts**`
      )
      .setColor(0x00FF00)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }

  // ── /leaderboard ───────────────────────────────────────────────────────────
  else if (commandName === 'leaderboard') {
    await interaction.reply({ embeds: [leaderboardEmbed()] });
  }

  // ── /drives ────────────────────────────────────────────────────────────────
  else if (commandName === 'drives') {
    await interaction.reply({ embeds: [drivesEmbed()] });
  }

  // ── /stats ─────────────────────────────────────────────────────────────────
  else if (commandName === 'stats') {
    const rank = db.prepare(`SELECT COUNT(*) + 1 as r FROM hunters WHERE points > (SELECT points FROM hunters WHERE discord_id=?)`).get(user.id)?.r || 1;
    const recentFinds = db.prepare('SELECT * FROM finds WHERE hunter_id=? ORDER BY logged_at DESC LIMIT 5').all(user.id);
    const fishFinds = db.prepare('SELECT COUNT(*) as c FROM finds WHERE hunter_id=? AND is_fish_title=1').get(user.id)?.c || 0;

    const embed = new EmbedBuilder()
      .setTitle(`🎯 ${hunter.display_name || hunter.username} — HUNTER STATS`)
      .setColor(0xFF6B00)
      .addFields(
        { name: '🏆 Points',        value: `${hunter.points.toLocaleString()}`, inline: true },
        { name: '📊 Rank',          value: `#${rank}`,                          inline: true },
        { name: '📁 Files Found',   value: `${hunter.files_found}`,             inline: true },
        { name: '💾 Drives Owned',  value: `${hunter.drives_owned}`,            inline: true },
        { name: '🐟 Fish Titles',   value: `${fishFinds}`,                      inline: true },
      );

    if (recentFinds.length) {
      const recentStr = recentFinds.map(f => `\`${f.filename}\` ${formatTier(f.format || '')} +${f.points_earned}pts`).join('\n');
      embed.addFields({ name: '📋 Recent Finds', value: recentStr });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // ── /findlog ───────────────────────────────────────────────────────────────
  else if (commandName === 'findlog') {
    const count = interaction.options.getInteger('count') || 10;
    const finds = db.prepare(`
      SELECT f.*, h.display_name, h.username
      FROM finds f JOIN hunters h ON f.hunter_id = h.discord_id
      ORDER BY f.logged_at DESC LIMIT ?
    `).all(Math.min(count, 25));

    if (!finds.length) return interaction.reply({ content: 'No finds logged yet. Start scanning!', ephemeral: true });

    const lines = finds.map(f =>
      `**#${f.id}** \`${f.filename}\` ${formatTier(f.format || '')} | ${f.display_name || f.username} | +${f.points_earned}pts`
    ).join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`📋 RECENT FINDS (last ${finds.length})`)
      .setDescription(lines)
      .setColor(0x7289DA);
    await interaction.reply({ embeds: [embed] });
  }

  // ── /hiddengem ─────────────────────────────────────────────────────────────
  else if (commandName === 'hiddengem') {
    const findId = interaction.options.getInteger('find_id');
    const find = db.prepare('SELECT * FROM finds WHERE id=?').get(findId);
    if (!find) return interaction.reply({ content: `❌ Find #${findId} not found.`, ephemeral: true });
    if (find.is_hidden_gem) return interaction.reply({ content: `⭐ Find #${findId} is already a hidden gem.`, ephemeral: true });

    db.prepare('UPDATE finds SET is_hidden_gem=1, points_earned = points_earned + ? WHERE id=?')
      .run(CONFIG.points.hiddenGem, findId);
    addPoints(find.hunter_id, CONFIG.points.hiddenGem);

    const finderHunter = db.prepare('SELECT * FROM hunters WHERE discord_id=?').get(find.hunter_id);
    const embed = new EmbedBuilder()
      .setTitle('💎 HIDDEN GEM CONFIRMED — RSP VERIFIED')
      .setDescription(
        `Find **#${findId}** — \`${find.filename}\`\n\n` +
        `**${finderHunter.display_name || finderHunter.username}** earns +${CONFIG.points.hiddenGem} pts.\n` +
        `This track has been flagged as an **unreleased / significant find** by Robert Stephen Plowman.`
      )
      .setColor(0xFFD700)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
  }
});

if (CONFIG.token) {
  client.login(CONFIG.token);
} else {
  console.log('⚠️ DISCORD_TOKEN is not set. Bot is initialized in mock diagnostic mode.');
}
