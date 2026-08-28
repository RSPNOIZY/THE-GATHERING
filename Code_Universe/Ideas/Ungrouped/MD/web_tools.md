# Web Tools Example

This example demonstrates how to enable and use the built-in web search tool
with an agent.

## Enabling Web Search

To use the web search tool, you must explicitly enable it in the
`CapabilitiesConfig` passed to `LocalAgentConfig`.

```python
from google.antigravity import Agent, LocalAgentConfig, CapabilitiesConfig, types

# Configure the agent to enable the SEARCH_WEB tool.
config = LocalAgentConfig(
    capabilities=CapabilitiesConfig(
        enabled_tools=[
            types.BuiltinTools.SEARCH_WEB,
        ]
    ),
)

async with Agent(config) as agent:
    response = await agent.chat("What is the current weather and temperature in New York City right now? Please provide the source.")
    print(await response.text())
```

> [!NOTE] When `SEARCH_WEB` is enabled, the agent can perform Google Searches to
> ground its responses with up-to-date web information.
