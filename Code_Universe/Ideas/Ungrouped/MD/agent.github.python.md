### Microsoft Agent Framework code samples (Python)

#### Quick Start
Connect GitHub model first, then create the agent instance:

``` python
from agent_framework import ChatAgent
from agent_framework.openai import OpenAIChatClient
from openai import AsyncOpenAI

async def quick_start() -> None:
    openaiClient=AsyncOpenAI(
        base_url="https://models.github.ai/inference",
        api_key="<GITHUB_TOKEN>",
    )
    chatClient=OpenAIChatClient(
        async_client=openaiClient,
        model_id="<model-id>"
    )
    agent=ChatAgent(
        chat_client=chatClient,
        name="MyAgent",
        instructions="You are a helpful agent.",
    )
    
    # use run_stream for best practice and production-grade app
    print("Agent: ", end="", flush=True)
    async for chunk in agent.run_stream("hello"):
        if chunk.text:
            print(chunk.text, end="", flush=True)
    print("\n")
    # Agent: Hello! How can I assist you today?
    # or, use run for testing
    # result = await agent.run("hello")
    # print(f"Agent: {result.text}") # Agent: Hello! How can I assist you today?
```

#### Add tool
Tools (or Function Callings) can let Agent interact with external APIs or services, enhancing its capabilities.

``` python
from random import randint
from typing import Annotated

# Define tool(s) and add to 'ChatAgent'
def get_weather(
    location: Annotated[str, "The location to get the weather for."],
) -> str:
    """Get the weather for a given location."""
    conditions = ["sunny", "cloudy", "rainy", "stormy"]
    return f"The weather in {location} is {conditions[randint(0, 3)]} with a high of {randint(10, 30)}°C."

async def quick_start_tools() -> None:
    #...
    agent=ChatAgent(
        chat_client=chatClient,
        name="MyAgent",
        instructions="You are a helpful agent.",
        tools=[get_weather],
    )

    print("Agent: ", end="", flush=True)
    async for chunk in agent.run_stream("What's the weather like in Seattle?"):
        if chunk.text:
            print(chunk.text, end="", flush=True)
    print("\n")
    # Agent: The weather in Seattle is rainy with a high of 18°C.
```

#### Multi-turn Conversation with Thread
Thread persistence across multiple conversations.

``` python
async def quick_start_thread() -> None:
    #...
    agent=ChatAgent(
        # settings...
    )
    # Create a new thread that will be reused
    thread = agent.get_new_thread()

    # First conversation
    print("Agent: ", end="", flush=True)
    async for chunk in agent.run_stream("What's the weather like in Seattle?", thread=thread):
        if chunk.text:
            print(chunk.text, end="", flush=True)
    print("\n")
    # Agent: The weather in Seattle is rainy with a high of 18°C.

    # Second conversation using the same thread - maintains context
    print("Agent: ", end="", flush=True)
    async for chunk in agent.run_stream("Pardon?", thread=thread):
        if chunk.text:
            print(chunk.text, end="", flush=True)
    print("\n")
    # Agent: Sure. The weather in Seattle is rainy with a high of 18°C.

    # or, for testing
    # result = await agent.run("Pardon?", thread=thread)
    # print(f"Agent: {result.text}") # Agent: Sure. The weather in Seattle is rainy with a high of 18°C.
```

#### Model Context Protocol (MCP) tools
Connect with MCP tools

```python
from agent_framework import MCPStdioTool, ToolProtocol, MCPStreamableHTTPTool
from typing import Any

def create_mcp_tools() -> list[ToolProtocol | Any]:
    return [
        # stdio sample - playwright
        MCPStdioTool(
            name="Playwright MCP",
            description="provides browser automation capabilities using Playwright",
            command="npx",
            args=[
                "-y",
                "@playwright/mcp@latest",
            ]
        ),
        # streamable http sample - microsoft learn
        MCPStreamableHTTPTool(
            name="Microsoft Learn MCP",
            description="bring trusted and up-to-date information directly from Microsoft's official documentation",
            url="https://learn.microsoft.com/api/mcp",
        )
    ]

async def quick_start_mcp() -> None:
    #...
    openaiClient=AsyncOpenAI(
        base_url="https://models.github.ai/inference",
        api_key="<GITHUB_TOKEN>",
    )
    async with (
        ChatAgent(
            chat_client=OpenAIChatClient(
                async_client=openaiClient,
                model_id="<model-id>"
            ),
            name="MyAgent",
            instructions="You are a helpful agent.",
            tools=create_mcp_tools(), # use MCP tools
        ) as agent
    ):
        thread = agent.get_new_thread()
        async for chunk in agent.run_stream(USER_INPUTS, thread=thread):
            if chunk.text:
                print(chunk.text, end="")
            elif (
                # print tool call details
                chunk.raw_representation
                and chunk.raw_representation.raw_representation
                and hasattr(chunk.raw_representation.raw_representation, "choices")
                and chunk.raw_representation.raw_representation.choices is not None
                and len(chunk.raw_representation.raw_representation.choices) > 0
                and hasattr(chunk.raw_representation.raw_representation.choices[0], "delta")
                and hasattr(chunk.raw_representation.raw_representation.choices[0].delta, "tool_calls")
                and chunk.raw_representation.raw_representation.choices[0].delta.tool_calls is not None
                and len(chunk.raw_representation.raw_representation.choices[0].delta.tool_calls) > 0
            ):
                toolCalls = list(filter(lambda call: call.function.name != None, chunk.raw_representation.raw_representation.choices[0].delta.tool_calls))
                if len(toolCalls) > 0:
                    print("")
                    print("Tool calls:", list(map(lambda call: call.function.name, toolCalls)))
        print("")
```
