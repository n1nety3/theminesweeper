'use client';

import { createContext, useContext } from 'react';

export interface ViewportTransform {
  x: number;
  y: number;
  scale: number;
}

export interface WorldClick {
  x: number;
  y: number;
  seq: number; // increments each click so useEffect can detect repeated taps on the same spot
}

export interface ViewportState {
  transform: ViewportTransform;
  containerWidth: number;
  containerHeight: number;
  worldClick: WorldClick | null;
}

export const ViewportContext = createContext<ViewportState>({
  transform: { x: 0, y: 0, scale: 1 },
  containerWidth: 0,
  containerHeight: 0,
  worldClick: null,
});

export const useViewportContext = () => useContext(ViewportContext);
