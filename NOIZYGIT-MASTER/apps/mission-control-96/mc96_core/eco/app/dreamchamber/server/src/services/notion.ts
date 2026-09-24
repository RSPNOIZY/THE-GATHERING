function notionHeaders() {
  return {
    Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
    "Notion-Version": process.env.NOTION_VERSION || "2022-06-28",
    "Content-Type": "application/json",
  };
}

export async function writeRunLog(args: {
  runId: string;
  intent: string;
  status: "Queued" | "Running" | "Succeeded" | "Failed";
  summary: string;
  error?: string;
}) {
  const databaseId = process.env.NOTION_RUNLOG_DATABASE_ID;
  if (!databaseId) {
    console.warn("NOTION_RUNLOG_DATABASE_ID not set, skipping run log");
    return { skipped: true };
  }

  const payload = {
    parent: { database_id: databaseId },
    properties: {
      "Run ID": {
        title: [{ text: { content: args.runId } }],
      },
      Intent: {
        rich_text: [{ text: { content: args.intent } }],
      },
      Status: {
        select: { name: args.status },
      },
      Summary: {
        rich_text: [{ text: { content: args.summary } }],
      },
      Error: {
        rich_text: [{ text: { content: args.error || "" } }],
      },
    },
  };

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: notionHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Notion write failed: ${res.status} ${text}`);
  }

  return res.json();
}
