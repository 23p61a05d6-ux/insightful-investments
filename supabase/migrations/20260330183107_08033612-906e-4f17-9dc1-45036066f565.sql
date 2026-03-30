-- Create analyses table
CREATE TABLE public.analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  ticker_symbol TEXT,
  analysis_period TEXT,
  total_assets NUMERIC NOT NULL,
  total_liabilities NUMERIC NOT NULL,
  current_assets NUMERIC NOT NULL,
  current_liabilities NUMERIC NOT NULL,
  total_equity NUMERIC NOT NULL,
  total_debt NUMERIC NOT NULL,
  debt_ratio NUMERIC NOT NULL,
  debt_to_equity_ratio NUMERIC NOT NULL,
  equity_ratio NUMERIC NOT NULL,
  current_ratio NUMERIC NOT NULL,
  ai_recommendation TEXT,
  ai_risk_score INTEGER,
  ai_confidence_level INTEGER,
  ai_strengths JSONB,
  ai_weaknesses JSONB,
  ai_summary TEXT,
  ai_reasoning TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth yet)
CREATE POLICY "Anyone can read analyses" ON public.analyses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert analyses" ON public.analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update analyses" ON public.analyses FOR UPDATE USING (true);