import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Experiment, Observation, Review, Variant, Metric, AudienceCondition, ExperimentStatus, LaunchStatus, ReviewSnapshot } from '@/types';
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
  snapshots: Record<string, ReviewSnapshot[]>;
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
  updateLaunchStatus: (experimentId: string, status: LaunchStatus) => void;
  createSnapshot: (experimentId: string) => ReviewSnapshot | null;
  getLatestSnapshot: (experimentId: string) => ReviewSnapshot | undefined;
  getSnapshotById: (snapshotId: string) => ReviewSnapshot | undefined;
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
      snapshots: {},
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
              launchStatus: ready ? 'pending' : undefined,
            } as Review,
          },
        })),
      updateLaunchStatus: (experimentId, status) =>
        set((s) => ({
          reviews: {
            ...s.reviews,
            [experimentId]: {
              ...s.reviews[experimentId],
              launchStatus: status,
              launchUpdatedAt: new Date().toISOString(),
            } as Review,
          },
        })),
      createSnapshot: (experimentId) => {
        const state = get();
        const experiment = state.experiments.find((e) => e.id === experimentId);
        const review = state.reviews[experimentId];
        if (!experiment || !review) return null;
        const existing = state.snapshots[experimentId] || [];
        const controlVariant = experiment.variants.find((v) => v.isControl);
        const testVariants = experiment.variants.filter((v) => !v.isControl);
        const sigData = testVariants.map((v) => {
          if (!controlVariant) return { variantId: v.id, variantName: v.name, liftPercent: 0, confidence: 0, isSignificant: false };
          const cv = controlVariant.conversionRate;
          const vv = v.conversionRate;
          const lift = cv > 0 ? ((vv - cv) / cv) * 100 : 0;
          return { variantId: v.id, variantName: v.name, liftPercent: lift, confidence: 95, isSignificant: Math.abs(lift) > 5 };
        });
        const snapshot: ReviewSnapshot = {
          id: `snap_${Date.now()}`,
          experimentId,
          version: existing.length + 1,
          createdAt: new Date().toISOString(),
          experiment: {
            name: experiment.name,
            goal: experiment.goal,
            description: experiment.description,
            pageUrl: experiment.pageUrl,
            status: experiment.status,
            startTime: experiment.startTime,
            endTime: experiment.endTime,
            createdBy: experiment.createdBy,
            variants: JSON.parse(JSON.stringify(experiment.variants)),
            metrics: JSON.parse(JSON.stringify(experiment.metrics)),
            winnerVariantId: experiment.winnerVariantId,
            totalVisitors: experiment.totalVisitors,
          },
          review: {
            conclusion: review.conclusion,
            winnerReason: review.winnerReason,
            lessonsLearned: review.lessonsLearned,
            risks: review.risks,
            isPublished: true,
            author: review.author,
            publishedAt: review.publishedAt || new Date().toISOString(),
            isWinnerReadyToLaunch: review.isWinnerReadyToLaunch,
            launchStatus: review.launchStatus,
            launchUpdatedAt: review.launchUpdatedAt,
          },
          significance: sigData,
        };
        set((s) => ({
          snapshots: {
            ...s.snapshots,
            [experimentId]: [...(s.snapshots[experimentId] || []), snapshot],
          },
        }));
        return snapshot;
      },
      getLatestSnapshot: (experimentId) => {
        const list = get().snapshots[experimentId] || [];
        return list.length > 0 ? list[list.length - 1] : undefined;
      },
      getSnapshotById: (snapshotId) => {
        const all = get().snapshots;
        for (const list of Object.values(all)) {
          const found = list.find((s) => s.id === snapshotId);
          if (found) return found;
        }
        return undefined;
      },
    }),
    {
      name: 'ab-experiment-storage',
      partialize: (s) => ({
        experiments: s.experiments,
        observations: s.observations,
        reviews: s.reviews,
        snapshots: s.snapshots,
        wizardDraft: s.wizardDraft,
      }),
    },
  ),
);
