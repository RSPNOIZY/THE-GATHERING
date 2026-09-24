// Audio Hijack — Noizy Airstream Session Script
// Purpose: Start sovereign audio stream for voice work
// Usage: Run in Audio Hijack Script Editor, cmd+R to execute
// Created: March 30, 2026

let session = app.sessions.byName("Noizy Airstream");

if (!session.exists()) {
  console.log("🎙️ Creating new session: Noizy Airstream");
  session = app.sessions.make({ name: "Noizy Airstream" });
}

try {
  session.start();
  console.log("✅ Noizy Airstream LIVE");
  console.log("⏱️  Started at " + new Date().toISOString());
  console.log("📍 Session ID: " + session.uuid);
} catch (error) {
  console.log("❌ Error starting session: " + error);
}

// Log session state
console.log("📊 Session state:");
console.log("  Name: " + session.name);
console.log("  Running: " + session.running);
console.log("  Blocks: " + session.blocks.length);
