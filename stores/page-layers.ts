import type { ReactNode } from "react";
import { create } from "zustand";
import { normalizePath } from "@/lib/page-href";

export type PageLayerEntry = {
  path: string;
  node: ReactNode;
  frozen: boolean;
};

type PageLayersState = {
  layers: PageLayerEntry[];
  register: (path: string, node: ReactNode) => void;
  dismiss: (path: string) => void;
  release: (path: string) => void;
};

export const usePageLayers = create<PageLayersState>((set) => ({
  layers: [],
  register: (path, node) => {
    const key = normalizePath(path);
    set((state) => {
      const index = state.layers.findIndex((layer) => layer.path === key);
      if (index === -1) {
        return {
          layers: [...state.layers, { path: key, node, frozen: false }],
        };
      }
      const layers = state.layers.slice();
      layers[index] = { path: key, node, frozen: false };
      return { layers };
    });
  },
  dismiss: (path) => {
    const key = normalizePath(path);
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.path === key ? { ...layer, frozen: true } : layer,
      ),
    }));
  },
  release: (path) => {
    const key = normalizePath(path);
    set((state) => ({
      layers: state.layers.filter((layer) => layer.path !== key),
    }));
  },
}));
