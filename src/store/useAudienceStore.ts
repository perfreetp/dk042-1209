import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Audience, AudienceCondition } from '@/types';
import { MOCK_AUDIENCES } from '@/data/experiments';

interface AudienceStore {
  audiences: Audience[];
  addAudience: (audience: Omit<Audience, 'id' | 'createdAt'>) => void;
  deleteAudience: (id: string) => void;
  updateAudience: (id: string, patch: Partial<Audience>) => void;
}

export const useAudienceStore = create<AudienceStore>()(
  persist(
    (set) => ({
      audiences: MOCK_AUDIENCES,
      addAudience: (a) =>
        set((s) => ({
          audiences: [
            {
              ...a,
              id: `aud_${Date.now()}`,
              createdAt: new Date().toISOString(),
            } as Audience,
            ...s.audiences,
          ],
        })),
      deleteAudience: (id) =>
        set((s) => ({
          audiences: s.audiences.filter((a) => a.id !== id),
        })),
      updateAudience: (id, patch) =>
        set((s) => ({
          audiences: s.audiences.map((a) =>
            a.id === id ? { ...a, ...patch } : a,
          ),
        })),
    }),
    {
      name: 'ab-audience-storage',
      partialize: (s) => ({ audiences: s.audiences }),
    },
  ),
);

export type { AudienceCondition };
