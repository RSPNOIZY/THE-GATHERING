function ghHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };
}

export async function dispatchDeployWorkflow(runId: string) {
  const owner = process.env.GITHUB_OWNER!;
  const repo = process.env.GITHUB_REPO!;
  const workflowId = process.env.GITHUB_WORKFLOW_ID!;
  const ref = process.env.GITHUB_REF || "main";

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`,
    {
      method: "POST",
      headers: ghHeaders(),
      body: JSON.stringify({
        ref,
        inputs: {
          run_id: runId,
          actor: "RSP001",
          environment: "production",
        },
      }),
    }
  );

  if (!res.ok && res.status !== 204) {
    const text = await res.text();
    throw new Error(`GitHub workflow dispatch failed: ${res.status} ${text}`);
  }

  return { ok: true, workflowId, ref };
}
