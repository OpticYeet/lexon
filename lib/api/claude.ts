import Anthropic from "@anthropic-ai/sdk";

let _anthropic: Anthropic | null = null;
function getClient() {
  if (!_anthropic) _anthropic = new Anthropic();
  return _anthropic;
}

export async function generatePaperSummary(
  title: string,
  abstract: string,
  field: string
): Promise<string> {
  const message = await getClient().messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `You are a science communicator. Given this paper abstract, write a 3-4 sentence plain English summary for a curious non-specialist. Focus on: what problem it solves, what the key finding is, and why it matters. Do not use jargon without brief explanation.

Title: ${title}
Field: ${field}

Abstract: ${abstract}`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type === "text") {
    return block.text;
  }
  throw new Error("Unexpected response from Claude API");
}
