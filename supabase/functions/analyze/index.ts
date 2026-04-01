/**
 * Analyze Edge Function
 * ---------------------
 * This Supabase Edge Function acts as a secure proxy to the Google Gemini API.
 * 
 * WHY AN EDGE FUNCTION?
 * - The Gemini API key is stored as a server-side secret (never exposed to client)
 * - The client calls this function via `supabase.functions.invoke('analyze', { body })`
 * - CORS headers allow the frontend to call this from any origin
 * 
 * INPUT: { companyName, debtRatio, debtToEquityRatio, equityRatio, currentRatio }
 * OUTPUT: { recommendation, riskScore, confidenceLevel, strengths[], weaknesses[], summary, reasoning }
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { companyName, debtRatio, debtToEquityRatio, equityRatio, currentRatio } = await req.json();

    // Validate input
    if (!companyName || debtRatio == null || debtToEquityRatio == null || equityRatio == null || currentRatio == null) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read API key from Supabase secrets (set via dashboard or CLI)
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY is not configured on the server" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the AI prompt with the calculated financial ratios
    const prompt = `You are a senior financial analyst with 20+ years of experience. Analyze this company's financial health based on the following balance sheet ratios:

Company: ${companyName}
Financial Ratios:
- Debt Ratio: ${debtRatio}% (measures what percentage of assets are financed by debt)
- Debt-to-Equity Ratio: ${debtToEquityRatio} (measures leverage — debt relative to shareholder equity)
- Equity Ratio: ${equityRatio}% (measures what percentage of assets are financed by equity)
- Current Ratio: ${currentRatio} (measures ability to pay short-term obligations)

Industry benchmarks for reference:
- Debt Ratio: <40% is good, 40-60% is moderate, >60% is high risk
- Debt-to-Equity: <1 is conservative, 1-2 is moderate, >2 is aggressive
- Equity Ratio: >50% is strong, 30-50% is adequate, <30% is weak
- Current Ratio: >1.5 is strong, 1-1.5 is adequate, <1 is concerning

Provide a comprehensive analysis in this EXACT JSON format (no markdown, no code blocks, just raw JSON):
{
  "recommendation": "STRONG BUY" or "BUY" or "HOLD" or "SELL" or "STRONG SELL",
  "riskScore": (number 0-100, where 0 is safest and 100 is highest risk),
  "confidenceLevel": (number 0-100, your confidence in this recommendation),
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "summary": "2-3 sentence executive summary of the company's financial health",
  "reasoning": "Detailed 3-4 sentence explanation of why you gave this recommendation, referencing the specific ratios"
}`;

    // Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,  // Low temperature for consistent, analytical responses
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Gemini API error", details: errText }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return new Response(JSON.stringify({ error: "No response from Gemini" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract JSON from the response (handle potential markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "Could not parse AI response", raw: text }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate the parsed response has required fields
    if (!parsed.recommendation || parsed.riskScore == null) {
      return new Response(JSON.stringify({ error: "AI response missing required fields", raw: text }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
