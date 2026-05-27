export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function callCompanyAI(messages: ChatMessage[]): Promise<string> {
  const baseUrl = process.env.COMPANY_AI_BASE_URL;
  const apiPath = process.env.COMPANY_AI_API_PATH;
  const apiKey = process.env.COMPANY_AI_API_KEY;

  if (!baseUrl || !apiPath || !apiKey) {
    throw new Error(
      "Company AI is not configured. Set COMPANY_AI_BASE_URL, COMPANY_AI_API_PATH, and COMPANY_AI_API_KEY in .env.local."
    );
  }

  const res = await fetch(`${baseUrl}${apiPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Company AI request failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
    message?: { content?: string };
    response?: string;
  };

  const content =
    data.choices?.[0]?.message?.content ??
    data.message?.content ??
    data.response ??
    "";

  if (!content) throw new Error("Company AI returned an empty response.");
  return content;
}
