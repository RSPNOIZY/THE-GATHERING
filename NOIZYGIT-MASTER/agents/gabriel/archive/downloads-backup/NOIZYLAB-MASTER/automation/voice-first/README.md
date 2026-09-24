# Voice-First Automation

Accessibility-first automation for Rob and M3 (Mike Nemesvary).

## Philosophy

**No typing required.** Every operation must be executable via:
- Voice command
- Single tap/click
- Eye tracking (future)

## Voice Command Structure

```
"Hey [Agent], [Action] [Target]"

Examples:
"Hey Shirl, check today's repairs"
"Hey Keith, deploy the worker"
"Hey Gabriel, sync the files"
```

## Talon Integration

```talon
# noizylab.talon

# Navigation
go lab: key(cmd-shift-l)
go repairs: open("https://noizylab.ca/dashboard")
go cloudflare: open("https://dash.cloudflare.com")

# Actions
check repairs: 
    insert("gorunfree status repairs")
    key(enter)

deploy now:
    insert("gorunfree deploy all")
    key(enter)

# Agent commands
ask shirl <phrase>:
    insert("gorunfree agent shirl \"{phrase}\"")
    key(enter)

ask keith <phrase>:
    insert("gorunfree agent engr_keith \"{phrase}\"")
    key(enter)
```

## ClaudeRMT Integration

Voice-controlled Claude interface from iPad.

```javascript
// Voice command handler
async function handleVoiceCommand(transcript) {
  const parsed = parseCommand(transcript);
  
  switch (parsed.agent) {
    case 'shirl':
      return await invokeAgent('shirl', parsed.command);
    case 'keith':
    case 'engr_keith':
      return await invokeAgent('engr_keith', parsed.command);
    case 'gabriel':
      return await invokeAgent('gabriel', parsed.command);
    default:
      return await defaultHandler(parsed.command);
  }
}

// Parse natural language
function parseCommand(transcript) {
  const agentMatch = transcript.match(/hey (\w+),?\s*(.*)/i);
  if (agentMatch) {
    return {
      agent: agentMatch[1].toLowerCase(),
      command: agentMatch[2]
    };
  }
  return { agent: null, command: transcript };
}
```

## Accessibility Requirements

1. **No keyboard required** - All operations voice/touch
2. **Large touch targets** - Minimum 44pt
3. **High contrast** - WCAG AAA compliance
4. **Audio feedback** - Confirmation sounds
5. **Error tolerance** - Fuzzy command matching

## M3 Integration

Solutions for Mike Nemesvary (quadriplegic world champion):
- Sip-and-puff compatibility
- Eye tracking support
- Switch access
- Voice-only operation

## Hardware

| Device | Use |
|--------|-----|
| iPad Pro | Primary interface |
| AirPods Max | Voice input |
| Mac Studio | Processing |
| Stream Deck | Quick actions |

---

*Voice-first isn't a feature. It's a requirement.*
