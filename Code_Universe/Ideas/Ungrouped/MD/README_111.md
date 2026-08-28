# 🎙️ NOIZYVOX Unity SDK v1.0.0

Professional AI voice synthesis SDK for Unity game development.

## Features

- **AI Voice Synthesis** - Generate dynamic character voices on-demand
- **Lip-Sync Support** - Automatic viseme generation for facial animation
- **Streaming Audio** - Real-time synthesis for low-latency playback
- **Dialogue System** - Built-in support for multi-character conversations
- **Caching** - Intelligent audio caching to reduce API calls
- **Prosody Control** - Adjust rate, pitch, and emotion

## Installation

### Via Unity Package Manager (UPM)

1. Open Package Manager (Window → Package Manager)
2. Click "+" → "Add package from git URL..."
3. Enter: `https://github.com/Noizyfish/NOIZYLAB.git?path=unity/Assets/Noizyvox`

### Manual Installation

1. Download the latest release
2. Extract to `Assets/Noizyvox/`

## Quick Start

### 1. Create Configuration

Right-click in Project → Create → Noizyvox → Configuration

Enter your API key (get one at https://noizyvox.ai/dashboard/api-keys)

### 2. Add Voice Component

```csharp
// Add NoizyvoxVoice component to any GameObject with AudioSource
var voice = gameObject.AddComponent<NoizyvoxVoice>();
```

### 3. Speak!

```csharp
// Simple one-liner
voice.Speak("Hello, adventurer! Welcome to our village.");

// Or async with result
var result = await voice.SpeakAsync("The dragon approaches!");
Debug.Log($"Duration: {result.DurationSeconds}s");
```

## Components

### NoizyvoxVoice

Main component for voice synthesis. Attach to any GameObject with an AudioSource.

```csharp
[RequireComponent(typeof(AudioSource))]
public class NoizyvoxVoice : MonoBehaviour
```

**Inspector Settings:**
- **Configuration** - Reference to NoizyvoxConfig asset
- **Persona ID** - Voice persona to use
- **Rate** - Speech rate (0.5 - 1.5)
- **Pitch** - Pitch adjustment in semitones (-12 to +12)
- **Volume** - Output volume (0 - 1)
- **DSP Recipe** - Audio processing preset
- **Enable Lip Sync** - Generate viseme data
- **Face Mesh** - SkinnedMeshRenderer for lip-sync
- **Lip Sync Mapping** - Viseme to blend shape mapping

**Events:**
- `OnSynthesisComplete` - Fired when synthesis finishes
- `OnSynthesisError` - Fired on error
- `OnPlaybackStarted` - Fired when audio starts playing
- `OnPlaybackComplete` - Fired when audio finishes

### NoizyvoxDialogue

Dialogue system for multi-character conversations.

```csharp
public class MyDialogueController : MonoBehaviour
{
    [SerializeField] private NoizyvoxDialogue dialogue;
    
    async void Start()
    {
        dialogue.OnLineStarted += line => {
            subtitleText.text = $"{line.CharacterName}: {line.Text}";
        };
        
        await dialogue.PlayDialogueAsync();
    }
}
```

### NoizyvoxClient

Low-level API client for direct access.

```csharp
using var client = new NoizyvoxClient(config);

// Get available personas
var personas = await client.GetPersonasAsync(new PersonaFilter {
    Genres = new List<string> { "fantasy", "sci-fi" },
    Emotions = new List<string> { "heroic" }
});

// Synthesize with full control
var result = await client.SynthesizeAsync(new SynthesisRequest {
    PersonaId = "hero_knight_001",
    Text = "For glory and honor!",
    Prosody = new Prosody {
        Rate = 0.9f,
        PitchSemitones = -2f,
        EmotionBlend = "determined:0.8,confident:0.2"
    },
    IncludeTimestamps = true,
    IncludeVisemes = true
});
```

## Lip-Sync Setup

1. Create mapping: Right-click → Create → Noizyvox → Lip Sync Mapping
2. Map viseme IDs to your character's blend shapes:

| Viseme ID | Description | Example Blend Shape |
|-----------|-------------|---------------------|
| AA | Open vowel (father) | Jaw_Open |
| EE | Smile vowel (see) | Mouth_Smile |
| OH | Round vowel (go) | Mouth_Round |
| OO | Pucker (too) | Mouth_Pucker |
| TH | Tongue (the) | Tongue_Out |
| CH | Teeth (church) | Teeth_Show |
| FF | Lip bite (five) | Lip_Bite |
| PP | Lips closed (pop) | Lips_Closed |

3. Assign to NoizyvoxVoice component

## Streaming

For real-time synthesis with minimal latency:

```csharp
await foreach (var chunk in client.StreamAsync(request))
{
    // Process audio chunk
    audioBuffer.AddSamples(chunk.Data, chunk.SampleRate, chunk.Channels);
    
    if (chunk.IsFinal)
        break;
}
```

## Error Handling

```csharp
try
{
    await voice.SpeakAsync("Hello!");
}
catch (NoizyvoxException ex)
{
    switch (ex.StatusCode)
    {
        case 401:
            Debug.LogError("Invalid API key");
            break;
        case 429:
            Debug.LogWarning("Rate limited, retrying...");
            await Task.Delay(1000);
            break;
        default:
            Debug.LogError($"Error: {ex.Message}");
            break;
    }
}
```

## Best Practices

1. **Cache Configuration** - Create one NoizyvoxConfig and reference it everywhere
2. **Reuse Clients** - Don't create new NoizyvoxClient for every request
3. **Enable Caching** - Reduce API calls for repeated phrases
4. **Preload Common Lines** - Synthesize common dialogue during loading screens
5. **Use Streaming** - For long text or interactive scenarios

## Support

- Documentation: https://docs.noizyvox.ai/unity
- Discord: https://discord.gg/noizyvox
- Email: support@noizyvox.ai

## License

See LICENSE.md for details.

---

Made with ❤️ by NOIZYVOX
