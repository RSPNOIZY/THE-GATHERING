# Lucy - Minimal & Topical Mode

## Philosophy

Lucy is **not a machine-gun narrator**. She's a calm **navigator** who gives you information when it's relevant - like a colleague mentioning what's important at that moment.

Think: "Here's where we are. Here's what matters right now."

---

## How It Works

### Minimal Mode (Default)

Lucy only speaks when there's **something actually worth saying**:

```
You: Make a small code change
Lucy: [Silent]

You: Add 15 lines of new functionality  
Lucy: "Code updated."

You: Ask a question
Lucy: [Answers naturally, conversationally]
```

### What Lucy Won't Do

- ❌ Narrate every keystroke
- ❌ Tell you about tiny changes
- ❌ Machine-gun information at you
- ❌ Be overly verbose or repetitive
- ❌ Interrupt your flow unnecessarily

### What Lucy Will Do

- ✅ Answer when you ask
- ✅ Mention significant changes
- ✅ Be conversational and natural
- ✅ Provide expert guidance
- ✅ Stay out of the way

---

## Commands - Minimal Style

```bash
lucy-start                    # "I'm here. What do you need?"
lucy-ask "question"           # Answers naturally
lucy-read-changes file.py     # "file.py. 42 lines."
lucy-status                   # Shows current state
lucy-set-speed 0.85          # Adjust if too fast/slow
```

---

## Real-World Example

### Scenario: You're Coding

```bash
# Start your session
$ lucy-start
🎙️  Lucy: "I'm here. What do you need?"

# Open your project
$ code projects/my-app

# You write some code...
[typing, making changes]
Lucy: [Silent - waiting for something worth mentioning]

# You add a large new feature
[add 20 lines of new code]
🎙️  Lucy: "Code updated."

# You need advice
$ lucy-ask "Should I use a class or function here?"
🎙️  Lucy: [Gives expert recommendation naturally]

# You want to know about your file
$ lucy-read-changes src/main.py
🎙️  Lucy: "main.py. 145 lines."
```

---

## Speed Control

Adjust how quickly Lucy speaks:

```bash
lucy-set-speed 0.7   # Slower, more deliberate
lucy-set-speed 0.85  # Normal (default)
lucy-set-speed 1.0   # Faster, more conversational
lucy-set-speed 1.2   # Quick and snappy
```

---

## When Lucy Speaks

### She WILL Mention

- Significant code changes (10+ lines)
- Your questions and answers
- Important file information
- Workflow checkpoints

### She WON'T Mention

- Fixing a typo
- Changing one variable name
- Tiny formatting changes
- Every edit you make

---

## Enable/Disable Notifications

```bash
# Turn notifications on (topical only)
lucy-enable-notifications

# Turn them off completely
lucy-disable-notifications

# Check status
lucy-status
```

---

## The Sweet Spot

Lucy is designed to be:

- **Present but not intrusive**
- **Knowledgeable but not show-off-y**
- **Helpful without being pushy**
- **Available when needed**
- **Silent when not needed**

Like a really smart colleague who knows when to speak up.

---

## Pro Tips

1. **Ask specific questions** - Lucy responds better to focused queries
2. **Let her be quiet** - Silence is part of the flow
3. **Use when needed** - Not every code session needs narration
4. **Topical not constant** - She mentions what matters
5. **Natural conversation** - Talk to her like a person, not a tool

---

**Philosophy**: Lucy is here to help you flow. Not to interrupt it.

Start with: `lucy-start`
