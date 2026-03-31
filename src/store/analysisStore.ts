import { create } from 'zustand';
import { AnalysisResult, AIAnalysis } from '@/types/analysis';
import { fetchAnalyses, saveAnalysis, updateAnalysisAI } from '@/lib/api';

interface AnalysisStore {
  analyses: AnalysisResult[];
  currentAnalysis: AnalysisResult | null;
  isAnalyzing: boolean;
  isLoading: boolean;
  setCurrentAnalysis: (analysis: AnalysisResult | null) => void;
  addAnalysis: (analysis: AnalysisResult) => Promise<void>;
  setIsAnalyzing: (val: boolean) => void;
  updateCurrentAI: (ai: AIAnalysis) => Promise<void>;
  loadAnalyses: () => Promise<void>;
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  analyses: [],
  currentAnalysis: null,
  isAnalyzing: false,
  isLoading: false,
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  addAnalysis: async (analysis) => {
    set((s) => ({ analyses: [analysis, ...s.analyses] }));
    try {
      await saveAnalysis(analysis);
    } catch (e) {
      console.error('Failed to save analysis:', e);
    }
  },
  setIsAnalyzing: (val) => set({ isAnalyzing: val }),
  updateCurrentAI: async (ai) => {
    const s = get();
    if (!s.currentAnalysis) return;
    const updated = { ...s.currentAnalysis, aiAnalysis: ai };
    set({
      currentAnalysis: updated,
      analyses: s.analyses.map((a) => a.id === updated.id ? updated : a),
    });
    try {
      await updateAnalysisAI(updated.id, ai);
    } catch (e) {
      console.error('Failed to update AI analysis:', e);
    }
  },
  loadAnalyses: async () => {
    set({ isLoading: true });
    try {
      const analyses = await fetchAnalyses();
      set({ analyses, isLoading: false });
    } catch (e) {
      console.error('Failed to load analyses:', e);
      set({ isLoading: false });
    }
  },
}));
