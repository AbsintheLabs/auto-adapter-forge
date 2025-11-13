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
    const { adapter, fields } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an Absinthe Adapter Config Generator.

Given:
- Adapter: ${adapter}
- Validated Fields: ${JSON.stringify(fields, null, 2)}

Produce a final JSON config that strictly matches Absinthe adapter-core format.
The config should include:
- Adapter type and version
- Contract addresses
- Chain information
- Block ranges
- Event signatures
- Pricing configurations
- All necessary metadata

Do NOT explain anything.
Output only valid JSON that can be directly used as an Absinthe adapter configuration.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Generate an Absinthe adapter config for ${adapter} with these fields: ${JSON.stringify(fields)}` 
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("AI gateway error:", error);
      throw new Error("Failed to generate config");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Try to parse the JSON from the response
    let config;
    try {
      config = JSON.parse(content);
    } catch {
      // If the response contains markdown code blocks, extract the JSON
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        config = JSON.parse(jsonMatch[1]);
      } else {
        config = JSON.parse(content);
      }
    }

    // Encode to base64
    const base64Config = btoa(JSON.stringify(config));

    return new Response(
      JSON.stringify({ config, base64: base64Config }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-config:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
