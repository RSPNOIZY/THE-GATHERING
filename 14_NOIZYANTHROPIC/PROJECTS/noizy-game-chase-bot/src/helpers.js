const { EmbedBuilder } = require('discord.js');
const db = require('./db');

const CONFIG = {
  channels: {
    leaderboard: 'noizy-leaderboard',
    chase:       'game-chase-down',
    announces:   'noizy-announces',
    log:         'archive-log',
  },
  // Scoring
  points: {
    fileFound:          10,    // Any audio file found and logged
    rareFormat:         50,    // DSF, DFF, AIFF master, 32-bit float WAV
    metadataComplete:   25,    // Full metadata: title, artist, year, BPM, key
    firstOnDrive:      100,    // First hunter to claim a drive
    driveComplete:     500,    // Fully scanned a drive
    fisherTitle:        75,    // Found a known Fish Music Inc. title
    hiddenGem:         200,    // Unreleased / unlisted track verified by RSP
    streak3:            30,    // 3 finds in a session
    streak10:          150,    // 10 finds in a session
  },
  // Audio formats and rarity tiers
  formats: {
    common:  ['mp3', 'aac', 'm4a', 'ogg', 'wma'],
    quality: ['wav', 'flac', 'alac', 'opus'],
    rare:    ['aiff', 'aif', 'dsf', 'dff', 'ape', 'wv', 'tta', 'caf'],
    lossless32: [], // WAV/AIFF at 32-bit — detected at log time
  },
  // The 10 drives to scan
  drives: [
    { id: 'DRIVE-01', label: 'Fish Archive 1',   capacity: '4TB',  status: 'unclaimed' },
    { id: 'DRIVE-02', label: 'Fish Archive 2',   capacity: '4TB',  status: 'unclaimed' },
    { id: 'DRIVE-03', label: 'Fish Archive 3',   capacity: '4TB',  status: 'unclaimed' },
    { id: 'DRIVE-04', label: 'Fish Archive 4',   capacity: '4TB',  status: 'unclaimed' },
    { id: 'DRIVE-05', label: 'Fish Archive 5',   capacity: '4TB',  status: 'unclaimed' },
    { id: 'DRIVE-06', label: 'Fish Archive 6',   capacity: '6TB',  status: 'unclaimed' },
    { id: 'DRIVE-07', label: 'Fish Archive 7',   capacity: '6TB',  status: 'unclaimed' },
    { id: 'DRIVE-08', label: 'Fish Archive 8',   capacity: '6TB',  status: 'unclaimed' },
    { id: 'DRIVE-09', label: 'RSP Masters',       capacity: '4TB',  status: 'unclaimed' },
    { id: 'DRIVE-10', label: 'Overflow / Mixed',  capacity: '4TB',  status: 'unclaimed' },
  ],
};

function getOrCreateHunter(discordId, username, displayName) {
  let hunter = db.prepare('SELECT * FROM hunters WHERE discord_id = ?').get(discordId);
  if (!hunter) {
    db.prepare(`INSERT INTO hunters (discord_id, username, display_name)
                VALUES (?, ?, ?)`).run(discordId, username, displayName || username);
    hunter = db.prepare('SELECT * FROM hunters WHERE discord_id = ?').get(discordId);
  }
  return hunter;
}

function addPoints(hunterId, pts) {
  db.prepare('UPDATE hunters SET points = points + ?, last_active = CURRENT_TIMESTAMP WHERE discord_id = ?')
    .run(pts, hunterId);
}

function calcPoints(find) {
  const { format, sample_rate, bit_depth, is_fish_title, is_hidden_gem,
          title, artist, year, bpm, key_sig } = find;
  let pts = CONFIG.points.fileFound;
  const fmt = (format || '').toLowerCase().replace('.', '');

  if (CONFIG.formats.rare.includes(fmt)) pts += CONFIG.points.rareFormat;
  if ((bit_depth === '32' || bit_depth === '32f') && ['wav','aiff','aif'].includes(fmt))
    pts += CONFIG.points.rareFormat;

  const metaComplete = title && artist && year && bpm && key_sig;
  if (metaComplete) pts += CONFIG.points.metadataComplete;
  if (is_fish_title) pts += CONFIG.points.fisherTitle;
  if (is_hidden_gem) pts += CONFIG.points.hiddenGem;

  return pts;
}

function formatTier(ext) {
  const e = ext.toLowerCase().replace('.', '');
  if (CONFIG.formats.rare.includes(e))    return '🔴 RARE';
  if (CONFIG.formats.quality.includes(e)) return '🟡 QUALITY';
  if (CONFIG.formats.common.includes(e))  return '🟢 COMMON';
  return '⚪ UNKNOWN';
}

function leaderboardEmbed() {
  const top = db.prepare(`SELECT * FROM hunters ORDER BY points DESC LIMIT 10`).all();
  const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
  const rows = top.map((h, i) =>
    `${medals[i]} **${h.display_name || h.username}** — ${h.points.toLocaleString()} pts | ${h.files_found} files`
  ).join('\n') || '*No hunters yet — be the first!*';

  const totalFiles = db.prepare('SELECT SUM(files_found) as t FROM hunters').get()?.t || 0;
  const totalDrives = db.prepare("SELECT COUNT(*) as c FROM drives WHERE status='complete'").get()?.c || 0;

  return new EmbedBuilder()
    .setTitle('🎮 MASSIVE GAME CHASE DOWN — LEADERBOARD')
    .setDescription(rows)
    .setColor(0xFF6B00)
    .addFields(
      { name: '📁 Total Files Cataloged', value: `${totalFiles.toLocaleString()}`, inline: true },
      { name: '💾 Drives Completed',       value: `${totalDrives}/10`,              inline: true },
      { name: '🎯 Fish Music Titles',      value: '888 total',                      inline: true },
    )
    .setFooter({ text: 'NOIZY.AI Archive Mission NOI-29 | fishmusicinc.com' })
    .setTimestamp();
}

function drivesEmbed() {
  const drives = db.prepare('SELECT * FROM drives ORDER BY drive_id').all();
  const lines = drives.map(d => {
    const icon = d.status === 'complete' ? '✅' : d.status === 'active' ? '🔵' : '⬜';
    const owner = d.claimed_by
      ? db.prepare('SELECT display_name, username FROM hunters WHERE discord_id=?').get(d.claimed_by)
      : null;
    const ownerStr = owner ? ` — ${owner.display_name || owner.username}` : '';
    return `${icon} **${d.drive_id}** ${d.label} (${d.capacity}) ${ownerStr}`;
  }).join('\n');

  return new EmbedBuilder()
    .setTitle('💾 DRIVE STATUS — 10 DRIVES / 46TB')
    .setDescription(lines)
    .setColor(0x00BFFF)
    .addFields({ name: 'Legend', value: '⬜ Unclaimed  🔵 Active  ✅ Complete' })
    .setFooter({ text: 'NOI-29 Archive Mission' });
}

module.exports = {
  CONFIG,
  getOrCreateHunter,
  addPoints,
  calcPoints,
  formatTier,
  leaderboardEmbed,
  drivesEmbed,
};
