# AI Investment Analyzer — Finance Analyzer

A full-stack web application for analyzing company balance sheets, calculating financial ratios, and generating AI-powered investment recommendations.

## 🏗️ Technology Stack

| Layer        | Technology                          | Purpose                                    |
|-------------|-------------------------------------|--------------------------------------------|
| **Frontend** | React 18 + Vite 5 + TypeScript     | UI framework and build tool                |
| **Styling**  | Tailwind CSS v3 + shadcn/ui        | Design system and component library        |
| **Charts**   | Recharts                           | Interactive bar, radar, and pie charts     |
| **State**    | Zustand                            | Client-side state management               |
| **PDF**      | jsPDF                              | Downloadable PDF report generation         |
| **File I/O** | xlsx + react-dropzone              | Excel/CSV file parsing and drag-drop UI    |
| **Backend**  | Supabase (Lovable Cloud)           | PostgreSQL database, Auth, Edge Functions  |
| **AI**       | Google Gemini API (gemini-2.0-flash)| AI-powered financial analysis              |

## 📂 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/          # AppLayout, AppSidebar (navigation shell)
│   ├── ui/              # shadcn/ui base components (Button, Input, etc.)
│   ├── FileUploadTab.tsx    # File upload with column mapping & validation
│   ├── ProtectedRoute.tsx   # Auth guard — redirects to /auth if not logged in
│   └── NavLink.tsx          # Active-state navigation link
├── hooks/
│   ├── useAuth.tsx      # Authentication hook (login, register, logout)
│   └── use-toast.ts     # Toast notification hook
├── lib/
│   ├── api.ts           # API layer — saves/fetches analyses, calls Gemini AI
│   ├── calculations.ts  # Financial ratio formulas and health assessments
│   ├── pdf.ts           # PDF report generation using jsPDF
│   ├── watchlist.ts     # Watchlist CRUD operations (add, remove, fetch)
│   └── utils.ts         # General utility functions
├── pages/
│   ├── AuthPage.tsx     # Login / Register page
│   ├── Dashboard.tsx    # Main dashboard with stats and quick actions
│   ├── NewAnalysis.tsx  # Data entry — manual, file upload, or ticker
│   ├── AnalysisResults.tsx  # Results page — ratios, charts, AI analysis
│   ├── HistoryPage.tsx  # List of all past analyses (from database)
│   ├── WatchlistPage.tsx    # Starred/tracked companies
│   ├── ComparisonPage.tsx   # Side-by-side company comparison
│   └── LandingPage.tsx      # Public landing page
├── store/
│   └── analysisStore.ts # Zustand store — manages analyses state
├── types/
│   └── analysis.ts      # TypeScript interfaces (BalanceSheetData, AIAnalysis, etc.)
└── integrations/
    └── supabase/
        ├── client.ts    # Supabase client (auto-generated, DO NOT EDIT)
        └── types.ts     # Database types (auto-generated, DO NOT EDIT)

supabase/
├── functions/
│   └── analyze/
│       └── index.ts     # Edge Function — proxies Gemini API calls securely
├── migrations/          # SQL migrations for database schema
└── config.toml          # Supabase project configuration
```

## 🗄️ Database Schema (Supabase PostgreSQL)

### `analyses` table
Stores all financial analysis results. Each row represents one analysis for one company in one period.
- **Columns**: company_name, ticker_symbol, analysis_period, total_assets, total_liabilities, current_assets, current_liabilities, total_equity, total_debt, debt_ratio, debt_to_equity_ratio, equity_ratio, current_ratio, ai_recommendation, ai_risk_score, ai_confidence_level, ai_strengths (JSON), ai_weaknesses (JSON), ai_summary, ai_reasoning, user_id, created_at
- **RLS**: Users can only read/insert/update their own analyses (filtered by `user_id = auth.uid()`)

### `profiles` table
Stores user profile information, auto-created on registration via a database trigger.
- **Columns**: id (matches auth.users.id), email, full_name, company, created_at
- **RLS**: Users can only access their own profile

### `watchlist` table
Tracks which analyses a user has starred/bookmarked.
- **Columns**: id, user_id, analysis_id (FK → analyses), created_at
- **RLS**: Users can only read/insert/delete their own watchlist entries

## 🔄 Data Flow

### Saving an Analysis
1. User enters data in `NewAnalysis.tsx` (manual or file upload)
2. `calculateRatios()` in `lib/calculations.ts` computes the 4 financial ratios
3. `analysisStore.addAnalysis()` saves to Zustand state AND calls `api.saveAnalysis()`
4. `api.saveAnalysis()` inserts the row into the `analyses` table via Supabase JS client

### AI Analysis
1. User clicks "Generate AI Recommendation" on `AnalysisResults.tsx`
2. `api.callGeminiAnalysis()` invokes the `analyze` Edge Function via `supabase.functions.invoke()`
3. The Edge Function (`supabase/functions/analyze/index.ts`) reads `GEMINI_API_KEY` from secrets, sends a structured prompt to Google Gemini API
4. Gemini returns JSON with recommendation, risk score, strengths, weaknesses, etc.
5. Result is saved to the `analyses` table and displayed in the UI

### Fetching History
1. `HistoryPage.tsx` calls `analysisStore.loadAnalyses()` on mount
2. This calls `api.fetchAnalyses()` which runs `supabase.from('analyses').select('*')`
3. RLS ensures only the current user's analyses are returned

## 🔐 Authentication
- Supabase Auth handles registration, login, and session management
- `ProtectedRoute` component wraps all dashboard routes
- `useAuth` hook provides `user`, `signIn`, `signUp`, `signOut`
- Email verification is required before first login

## 📊 Financial Ratios Calculated
1. **Debt Ratio** = Total Debt / Total Assets × 100
2. **Debt-to-Equity Ratio** = Total Debt / Total Equity
3. **Equity Ratio** = Total Equity / Total Assets × 100
4. **Current Ratio** = Current Assets / Current Liabilities
