/**
 * Analyze Edge Function — AI Financial Analysis via Lovable AI Gateway
 * Uses the pre-configured LOVABLE_API_KEY (no user API key needed).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyName, debtRatio, debtToEquityRatio, equityRatio, currentRatio } = await req.json();

    if (!companyName || debtRatio == null || debtToEquityRatio == null || equityRatio == null || currentRatio == null) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a senior financial analyst with 20+ years of experience. Analyze this company based on balance sheet ratios.

Company: ${companyName}

Ratios:
- Debt Ratio: ${debtRatio}% (<40% good, 40-60% moderate, >60% high risk)
- Debt-to-Equity: ${debtToEquityRatio} (<1 conservative, 1-2 moderate, >2 aggressive)
- Equity Ratio: ${equityRatio}% (>50% strong, 30-50% adequate, <30% weak)
- Current Ratio: ${currentRatio} (>1.5 strong, 1-1.5 adequate, <1 concerning)

Respond with ONLY a valid JSON object:
{
  "recommendation": "STRONG BUY" or "BUY" or "HOLD" or "SELL" or "STRONG SELL",
  "riskScore": <integer 0-100>,
  "confidenceLevel": <integer 0-100>,
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "summary": "<2-3 sentence executive summary>",
  "reasoning": "<detailed 3-5 sentence explanation referencing specific ratio values>"
}

strengths must have exactly 3 items, weaknesses exactly 2. Output ONLY JSON.`;

    // Call Gemini API directly
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return new Response(JSON.stringify({ error: `Gemini API error (${response.status}): ${errText.substring(0, 200)}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("Empty Gemini response:", JSON.stringify(data).substring(0, 500));
      return new Response(JSON.stringify({ error: "AI returned an empty response. Please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Robust JSON extraction
    let jsonStr = text.trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in AI response:", text);
      return new Response(JSON.stringify({ error: "AI response format error. Please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // Attempt repair
      const repaired = jsonMatch[0]
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/[\x00-\x1F\x7F]/g, "");
      try {
        parsed = JSON.parse(repaired);
      } catch {
        console.error("JSON parse failed:", jsonMatch[0].substring(0, 300));
        return new Response(JSON.stringify({ error: "AI returned malformed data. Please try again." }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Sanitize fields
    const validRecs = ["STRONG BUY", "BUY", "HOLD", "SELL", "STRONG SELL"];
    if (!validRecs.includes(parsed.recommendation)) parsed.recommendation = "HOLD";
    parsed.riskScore = Math.max(0, Math.min(100, Math.round(Number(parsed.riskScore) || 50)));
    parsed.confidenceLevel = Math.max(0, Math.min(100, Math.round(Number(parsed.confidenceLevel) || 60)));
    parsed.strengths = Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : ["Financial data analyzed"];
    parsed.weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 5) : ["Limited data available"];
    parsed.summary = String(parsed.summary || "Analysis completed.");
    parsed.reasoning = String(parsed.reasoning || "Based on provided ratios.");

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze error:", e);
    return new Response(JSON.stringify({ error: `Analysis failed: ${e instanceof Error ? e.message : "Unknown error"}` }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
