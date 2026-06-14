import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Experiment, Observation, Review, Variant, Metric, AudienceCondition, ExperimentStatus } from '@/types';
import { MOCK_EXPERIMENTS, MOCK_OBSERVATIONS, MOCK_REVIEWS } from '@/data/experiments';

interface WizardDraft {
  name: string;
  goal: string;
  description: string;
  pageUrl: string;
  startTime: string;
  endTime: string;
  variants: Variant[];
  audienceConditions: AudienceCondition[];
  metrics: Metric[];
  audienceId?: string;
  currentStep: number;
}

interface ExperimentStore {
  experiments: Experiment[];
  observations: Observation[];
  reviews: Record<string, Review>;
  wizardDraft: WizardDraft;
  setWizardDraft: (draft: Partial<WizardDraft>) => void;
  resetWizardDraft: () => void;
  addExperiment: (exp: Experiment) => void;
  updateExperiment: (id: string, patch: Partial<Experiment>) => void;
  updateExperimentStatus: (id: string, status: ExperimentStatus) => void;
  getExperiment: (id: string) => Experiment | undefined;
  getObservations: (experimentId: string) => Observation[];
  addObservation: (obs: Observation) => void;
  getReview: (experimentId: string) => Review | undefined;
  upsertReview: (experimentId: string, review: Partial<Review>) => void;
  markWinner: (experimentId: string, variantId: string) => void;
  markReadyToLaunch: (experimentId: string, ready: boolean) => void;
}

const defaultDraft: WizardDraft = {
  name: '',
  goal: '',
  description: '',
  pageUrl: '',
  startTime: '',
  endTime: '',
  variants: [
    {
      id: 'control_draft',
      experimentId: '',
      name: '原始版本',
      description: '',
      trafficPercent: 50,
      isControl: true,
      visitors: 0,
      conversions: 0,
      conversionRate: 0,
    },
    {
      id: 'variant_1_draft',
      experimentId: '',
      name: '变体 1',
      description: '',
      trafficPercent: 50,
      isControl: false,
      visitors: 0,
      conversions: 0,
      conversionRate: 0,
    },
  ],
  audienceConditions: [],
  metrics: [],
  currentStep: 0,
};

export const useExperimentStore = create<ExperimentStore>()(
  persist(
    (set, get) => ({
      experiments: MOCK_EXPERIMENTS,
      observations: MOCK_OBSERVATIONS,
      reviews: MOCK_REVIEWS,
      wizardDraft: defaultDraft,
      setWizardDraft: (draft) =>
        set((s) => ({
          wizardDraft: { ...s.wizardDraft, ...draft },
        })),
      resetWizardDraft: () => set({ wizardDraft: defaultDraft }),
      addExperiment: (exp) => set((s) => ({ experiments: [exp, ...s.experiments] })),
      updateExperiment: (id, patch) =>
        set((s) => ({
          experiments: s.experiments.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        })),
      updateExperimentStatus: (id, status) =>
        set((s) => ({
          experiments: s.experiments.map((e) => (e.id === id ? { ...e, status } : e)),
        })),
      getExperiment: (id) => get().experiments.find((e) => e.id === id),
      getObservations: (experimentId) =>
        get()
          .observations.filter((o) => o.experimentId === experimentId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      addObservation: (obs) => set((s) => ({ observations: [obs, ...s.observations] })),
      getReview: (experimentId) => get().reviews[experimentId],
      upsertReview: (experimentId, review) =>
        set((s) => ({
          reviews: {
            ...s.reviews,
            [experimentId]: {
              id: `rev_${Date.now()}`,
              experimentId,
              conclusion: '',
              winnerReason: '',
              lessonsLearned: '',
              risks: '',
              isPublished: false,
              author: '当前用户',
              ...(s.reviews[experimentId] ?? {}),
              ...review,
            } as Review,
          },
        })),
      markWinner: (experimentId, variantId) =>
        set((s) => ({
          experiments: s.experiments.map((e) =>
            e.id === experimentId ? { ...e, winnerVariantId: variantId } : e,
          ),
        })),
      markReadyToLaunch: (experimentId, ready) =>
        set((s) => ({
          reviews: {
            ...s.reviews,
            [experimentId]: {
              ...s.reviews[experimentId],
              isWinnerReadyToLaunch: ready,
            } as Review,
          },
        })),
    }),
    {
      name: 'ab-experiment-storage',
      partialize: (s) => ({
        experiments: s.experiments,
        observations: s.observations,
        reviews: s.reviews,
        wizardDraft: s.wizardDraft,
      }),
    },
  ),
);
