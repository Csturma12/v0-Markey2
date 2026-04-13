// Anthropic API proxy route

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log("[v0] API Key present:", !!apiKey);
    console.log("[v0] API Key first 10 chars:", apiKey?.substring(0, 10));
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: { message: "ANTHROPIC_API_KEY not configured on server" } }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("[v0] Anthropic response status:", response.status);

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.log("[v0] Error in /api/chat:", errorMessage);
    return new Response(JSON.stringify({ error: { message: errorMessage } }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
}
