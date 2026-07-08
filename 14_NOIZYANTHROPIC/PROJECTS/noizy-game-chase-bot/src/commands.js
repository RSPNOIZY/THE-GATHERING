const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('join')
    .setDescription('Join the Massive Game Chase Down as a Hunter'),

  new SlashCommandBuilder()
    .setName('claim')
    .setDescription('Claim a drive to scan')
    .addStringOption(o => o.setName('drive').setDescription('Drive ID (e.g. DRIVE-03)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('log')
    .setDescription('Log an audio file find and earn points')
    .addStringOption(o => o.setName('drive').setDescription('Drive ID').setRequired(true))
    .addStringOption(o => o.setName('filename').setDescription('Filename with extension').setRequired(true))
    .addStringOption(o => o.setName('format').setDescription('Audio format (wav/aiff/ogg/mp3/flac/etc)').setRequired(true))
    .addNumberOption(o => o.setName('size_mb').setDescription('File size in MB'))
    .addStringOption(o => o.setName('sample_rate').setDescription('Sample rate (e.g. 48000, 96000)'))
    .addStringOption(o => o.setName('bit_depth').setDescription('Bit depth (e.g. 16, 24, 32)'))
    .addStringOption(o => o.setName('title').setDescription('Track title (if known)'))
    .addStringOption(o => o.setName('artist').setDescription('Artist name (if known)'))
    .addStringOption(o => o.setName('year').setDescription('Year (if known)'))
    .addStringOption(o => o.setName('bpm').setDescription('BPM (if known)'))
    .addStringOption(o => o.setName('key').setDescription('Musical key (if known)'))
    .addBooleanOption(o => o.setName('is_fish').setDescription('Is this a known Fish Music Inc. title?'))
    .addStringOption(o => o.setName('notes').setDescription('Any additional notes')),

  new SlashCommandBuilder()
    .setName('complete')
    .setDescription('Mark a drive as fully scanned and claim completion bonus')
    .addStringOption(o => o.setName('drive').setDescription('Drive ID').setRequired(true)),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Show the current leaderboard'),

  new SlashCommandBuilder()
    .setName('drives')
    .setDescription('Show status of all 10 drives'),

  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Show your personal hunt stats'),

  new SlashCommandBuilder()
    .setName('findlog')
    .setDescription('Show recent finds')
    .addIntegerOption(o => o.setName('count').setDescription('How many recent finds to show (default 10)')),

  new SlashCommandBuilder()
    .setName('hiddengem')
    .setDescription('[RSP ONLY] Mark a find as a hidden gem and award bonus')
    .addIntegerOption(o => o.setName('find_id').setDescription('Find ID from /findlog').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
].map(c => c.toJSON());

module.exports = commands;
