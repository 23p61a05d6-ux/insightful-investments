import { create } from 'zustand';
import { AnalysisResult, BalanceSheetData, CalculatedRatios, AIAnalysis } from '@/types/analysis';

interface AnalysisStore {
  analyses: AnalysisResult[];
  currentAnalysis: AnalysisResult | null;
  isAnalyzing: boolean;
  setCurrentAnalysis: (analysis: AnalysisResult | null) => void;
  addAnalysis: (analysis: AnalysisResult) => void;
  setIsAnalyzing: (val: boolean) => void;
  updateCurrentAI: (ai: AIAnalysis) => void;
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  analyses: [],
  currentAnalysis: null,
  isAnalyzing: false,
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  addAnalysis: (analysis) => set((s) => ({ analyses: [analysis, ...s.analyses] })),
  setIsAnalyzing: (val) => set({ isAnalyzing: val }),
  updateCurrentAI: (ai) => set((s) => {
    if (!s.currentAnalysis) return s;
    const updated = { ...s.currentAnalysis, aiAnalysis: ai };
    return {
      currentAnalysis: updated,
      analyses: s.analyses.map((a) => a.id === updated.id ? updated : a),
    };
  }),
}));
