export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// Glean author values
const AUTHOR_MAP: Record<string, string> = {
  user: "USER",
  assistant: "GLEAN_AI",
  system: "USER", // Glean doesn't have a system role; prepend to first user message instead
};

export async function callCompanyAI(messages: ChatMessage[]): Promise<string> {
  const baseUrl = process.env.COMPANY_AI_BASE_URL;
  const apiPath = process.env.COMPANY_AI_API_PATH;
  const apiKey = process.env.COMPANY_AI_API_KEY;

  if (!baseUrl || !apiPath || !apiKey) {
    throw new Error(
      "Company AI is not configured. Set COMPANY_AI_BASE_URL, COMPANY_AI_API_PATH, and COMPANY_AI_API_KEY in .env.local."
    );
  }

  // Merge any system messages into the first user message so Glean receives them
  let processedMessages = messages;
  const systemMessages = messages.filter((m) => m.role === "system");
  const nonSystemMessages = messages.filter((m) => m.role !== "system");
  if (systemMessages.length > 0 && nonSystemMessages.length > 0) {
    const systemPrefix = systemMessages.map((m) => m.content).join("\n\n");
    processedMessages = [
      { role: "user", content: `${systemPrefix}\n\n${nonSystemMessages[0].content}` },
      ...nonSystemMessages.slice(1),
    ];
  }

  // Convert to Glean's native message format
  const gleanMessages = processedMessages.map((m) => ({
    author: AUTHOR_MAP[m.role] ?? "USER",
    fragments: [{ text: m.content }],
  }));

  const res = await fetch(`${baseUrl}${apiPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ messages: gleanMessages, stream: false }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Company AI request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    // Glean native response
    messages?: { author?: string; fragments?: { text?: string }[] }[];
    // OpenAI-compatible fallback
    choices?: { message?: { content?: string } }[];
    message?: { content?: string };
    response?: string;
  };

  // Try Glean format first (last message from GLEAN_AI), then OpenAI-compatible fallbacks
  const gleanContent = data.messages
    ?.filter((m) => m.author === "GLEAN_AI")
    .at(-1)
    ?.fragments?.map((f) => f.text ?? "")
    .join("") ?? "";

  const content =
    gleanContent ||
    data.choices?.[0]?.message?.content ||
    data.message?.content ||
    data.response ||
    "";

  if (!content) throw new Error("Company AI returned an empty response.");
  return content;
}
