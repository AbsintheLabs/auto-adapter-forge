import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an Absinthe adapter classifier. Based on the user's description, determine which adapter type they need.
Available adapters:
- univ2: Uniswap V2 (liquidity pools, swaps)
- univ3: Uniswap V3 (concentrated liquidity, swaps, fee tiers)
- morpho: Morpho lending protocol (markets, collateral, loans)
- printr: Printr protocol
- erc20: ERC20 token holdings tracking

Respond with ONLY a JSON object in this format:
{
  "adapter": "univ2|univ3|morpho|printr|erc20",
  "trackables": ["swap", "mint", "burn"],
  "confidence": 0.95
}`,
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI gateway error:", error);
      throw new Error("Failed to classify adapter");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const classification = JSON.parse(content);

    return new Response(JSON.stringify(classification), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in classify-adapter:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
