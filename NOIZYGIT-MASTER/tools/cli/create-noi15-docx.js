#!/usr/bin/env node

const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');
const path = require('path');

const doc = new Document({
  sections: [{
    children: [
      // Title
      new Paragraph({
        text: "NOI-15 — Consent Architecture Blueprint",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      
      // Subtitle
      new Paragraph({
        text: "Archived from Slack DM, March 5, 2026",
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        italics: true,
      }),
      
      // Author
      new Paragraph({
        text: "Author: Robert Stephen Plowman (RSP_001)",
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
      
      // The Benchmark Section
      new Paragraph({
        text: "THE BENCHMARK: WHAT YOU MUST BEAT (FACT-BASED)",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 },
      }),
      
      new Paragraph({
        text: "ElevenLabs sets three key constraints you must surpass:",
        spacing: { after: 100 },
      }),
      
      new Paragraph({
        text: "1. Commercial use is plan-bound. Their help center states the free plan is non-commercial, and paid plans include a commercial license (with limitations for Beta services).",
        spacing: { after: 100 },
      }),
      
      new Paragraph({
        text: "2. They already offer creator monetization via a Voice Library royalty system. ElevenLabs describes \"Payouts\" as a royalty model tied to Voice Library usage, tracking by character count, with a default rate \"around $0.03 per 1,000 characters,\" and weekly payouts via Stripe Connect once a balance threshold is reached.",
        spacing: { after: 100 },
      }),
      
      new Paragraph({
        text: "3. They govern usage via Terms + Prohibited Use Policy.",
        spacing: { after: 200 },
      }),
      
      new Paragraph({
        text: "So \"better for artists\" cannot simply mean \"also has voices.\" It must mean:",
        spacing: { after: 100 },
      }),
      
      new Paragraph({
        text: "• Artists control rights + terms (not the platform)",
        spacing: { after: 50 },
      }),
      
      new Paragraph({
        text: "• Artists participate in upside in ways that survive scale",
        spacing: { after: 50 },
      }),
      
      new Paragraph({
        text: "• Consent is enforceable infrastructure",
        spacing: { after: 50 },
      }),
      
      new Paragraph({
        text: "• Provenance/labeling is built in (regulatory tailwind)",
        spacing: { after: 300 },
      }),
      
      // Core Invention Section
      new Paragraph({
        text: "THE CORE INVENTION: CONSENT AS ARCHITECTURE (NOT COMPLIANCE)",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 },
      }),
      
      new Paragraph({
        text: "The NOIZY-Class Principle: No output can exist without an attached, machine-enforceable permission structure.",
        spacing: { after: 200 },
        italics: true,
      }),
      
      new Paragraph({
        text: "Build a \"Consent Kernel\" with four primitives:",
        spacing: { after: 100 },
      }),
      
      new Paragraph({
        text: "1. Identity Asset: the artist + voice model as a rights-bearing object",
        spacing: { after: 50 },
      }),
      
      new Paragraph({
        text: "2. License Policy: where/how it can be used (scope, duration, territory, content classes)",
        spacing: { after: 50 },
      }),
      
      new Paragraph({
        text: "3. Revenue Policy: how royalties are calculated and distributed",
        spacing: { after: 50 },
      }),
      
      new Paragraph({
        text: "4. Revocation Policy: what happens if the artist withdraws or modifies permissions",
        spacing: { after: 300 },
      }),
      
      // System Architecture Section
      new Paragraph({
        text: "SYSTEM ARCHITECTURE (END-TO-END)",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 },
      }),
      
      // A) Creator Onboarding
      new Paragraph({
        text: "A) Creator Onboarding (Artist-First)",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 100 },
      }),
      
      new Paragraph({
        text: "Goal: creators should feel safe before they feel impressed.",
        spacing: { after: 100 },
        italics: true,
      }),
      
      new Paragraph({
        text: "• Consent Vault: stores explicit permissions, signatures, and allowed-use matrices",
        spacing: { after: 50 },
      }),
      
      new Paragraph({
        text: "• Training Rights Split: separate permission for \"recording usage\" vs \"model creation\" vs \"downstream usage\"",
        spacing: { after: 50 },
      }),
      
      new Paragraph({
        text: "• Disclosure Preferences: where the artist requires labeling",
        spacing: { after: 200 },
      }),
      
      // B) Model Creation
      new Paragraph({
        text: "B) Model Creation (Consent-Locked by Design)",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 100 },
      }),
      
      new Paragraph({
        text: "Goal: prevent \"permission stripping.\"",
        spacing: { after: 100 },
        italics: true,
      }),
      
      new Paragraph({
        text: "Every model version has a Policy Hash (a cryptographic pointer to license + payout terms). Training data metadata includes: source, authorization, purpose, retention.",
        spacing: { after: 200 },
      }),
      
      // C) Marketplace / Distribution
      new Paragraph({
        text: "C) Marketplace / Distribution (Artists are not inventory)",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 100 },
      }),
      
      new Paragraph({
        text: "Goal: shift from \"voice catalog\" to \"licensed identity network.\"",
        spacing: { after: 100 },
        italics: true,
      }),
      
      new Paragraph({
        text: "Buyers browse permissions, not just sound. Creators set per-use rates, minimums, categories allowed/blocked, required disclosure language.",
        spacing: { after: 200 },
      }),
      
      // D) Runtime Generation
      new Paragraph({
        text: "D) Runtime Generation (Provenance + Watermarking native)",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 100 },
      }),
      
      new Paragraph({
        text: "Goal: outputs are traceable, detectable, and compliant by default.",
        spacing: { after: 100 },
        italics: true,
      }),
      
      new Paragraph({
        text: "Three layers:",
        spacing: { after: 50 },
      }),
      
      new Paragraph({
        text: "1. File metadata: machine-readable \"synthetic\" + issuer + policy hash",
        spacing: { after: 50 },
      }),
      
      new Paragraph({
        text: "2. Imperceptible watermark: robust marker in audio signal",
        spacing: { after: 50 },
      }),
      
      new Paragraph({
        text: "3. Public verifier: a way to check \"was this generated under license X?\"",
        spacing: { after: 200 },
      }),
      
      // E) Royalties + Accounting
      new Paragraph({
        text: "E) Royalties + Accounting (The artist gets paid when used)",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 100 },
      }),
      
      new Paragraph({
        text: "• Granular billing: per second / per character / per seat / per distribution channel",
        spacing: { after: 50 },
      }),
      
      new Paragraph({
        text: "• Usage receipts with: buyer org, content class, license invoked, watermark id, payout split",
        spacing: { after: 50 },
      }),
      
      new Paragraph({
        text: "• Automated audits: if a buyer exports content, the receipt travels with it",
        spacing: { after: 200 },
      }),
      
      // F) Safety + Misuse Prevention
      new Paragraph({
        text: "F) Safety + Misuse Prevention (Artist-centered)",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 100 },
      }),
      
      new Paragraph({
        text: "• Artist-defined no-go zones beyond platform policy",
        spacing: { after: 50 },
      }),
      
      new Paragraph({
        text: "• Misuse detection loop: verifier sees watermark in disallowed context, flags buyer + distribution partner, triggers license enforcement",
        spacing: { after: 300 },
      }),
      
      // Product Surface Section
      new Paragraph({
        text: "PRODUCT SURFACE: WHAT USERS ACTUALLY TOUCH",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 },
      }),
      
      new Paragraph({
        text: "For Artists (Creator Console):",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 },
      }),
      
      new Paragraph({
        text: "Consent Vault, Rate card + licensing presets, Versioning + revocation controls, Earnings dashboard + receipts, \"Where my voice is appearing\" tracker",
        spacing: { after: 200 },
      }),
      
      new Paragraph({
        text: "For Studios (Compliance-First Buyer Portal):",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 },
      }),
      
      new Paragraph({
        text: "Filter voices by permitted uses, License generator + disclosure templates, Enterprise audit logs + receipts, \"Proof of authorization\" export pack",
        spacing: { after: 200 },
      }),
      
      new Paragraph({
        text: "For Regulators / Platforms (Verifier + Transparency):",
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 100, after: 50 },
      }),
      
      new Paragraph({
        text: "Machine-readable marking, provenance disclosure",
        spacing: { after: 300 },
      }),
      
      // MVP → Scale Plan Section
      new Paragraph({
        text: "MVP → SCALE PLAN",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 200 },
      }),
      
      new Paragraph({
        text: "MVP: 1. Consent Vault + license presets, 2. Generation receipts + payout splits, 3. Metadata marking + basic verification, 4. Creator console + buyer portal",
        spacing: { after: 100 },
      }),
      
      new Paragraph({
        text: "V2: 5. Multi-layer watermarking, 6. Revocation semantics + downstream enforcement, 7. Enterprise compliance packs",
        spacing: { after: 100 },
      }),
      
      new Paragraph({
        text: "V3: 8. Signal intelligence, 9. Community + collaboration primitives",
        spacing: { after: 300 },
      }),
      
      // North Star Section
      new Paragraph({
        text: "NORTH STAR",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      
      new Paragraph({
        text: "\"A consent-native voice system where artists control the terms, and value accrues to the creator every time the identity is used.\"",
        spacing: { after: 300 },
        italics: true,
      }),
      
      // Claude's Response Section
      new Paragraph({
        text: "CLAUDE'S RESPONSE (March 5, 2026)",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      
      new Paragraph({
        text: "\"This is a genuinely strong blueprint — the 'Consent as Architecture' framing is the right move, and the Policy Hash + generation receipt model is where the real defensibility lives.\"",
        spacing: { after: 200 },
        italics: true,
      }),
      
      new Paragraph({
        text: "Key feedback:",
        spacing: { after: 100 },
        bold: true,
      }),
      
      new Paragraph({
        text: "• The three-way permission split (recording usage ≠ model creation ≠ downstream usage) is a real moat if enforced at infrastructure layer",
        spacing: { after: 50 },
      }),
      
      new Paragraph({
        text: "• Usage receipt traveling with exported content transforms royalties from \"trust us\" to \"provable\"",
        spacing: { after: 50 },
      }),
      
      new Paragraph({
        text: "• Tension: Revocation semantics in V2 — what happens to already-generated content that's been licensed and distributed? Clear answer needed before enterprise buyers sign.",
        spacing: { after: 400 },
      }),
      
      // Footer
      new Paragraph({
        text: "Document archived: 2026-03-25",
        alignment: AlignmentType.RIGHT,
        spacing: { before: 300 },
        size: 18,
        italics: true,
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  const outputPath = '/sessions/elegant-sharp-allen/mnt/NOIZYLAB/docs/NOI-15_Consent_Architecture_Blueprint.docx';
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document created successfully at ${outputPath}`);
  process.exit(0);
}).catch(err => {
  console.error('Error creating document:', err);
  process.exit(1);
});
