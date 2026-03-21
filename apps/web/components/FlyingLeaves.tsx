'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const LEAF_COUNT = 5;
const LEAF_ICONS = ['leaf-01.svg','leaf-02.svg','leaf-03.svg','leaf-04.svg','leaf-05.svg'];

interface Leaf {
  id: number;
  icon: string;
  el: HTMLImageElement;
  x: number; y: number;
  vx: number; vy: number;
  rot: number; rotV: number;
  opacity: number;
  life: number; maxLife: number;
}

export default function FlyingLeaves() {
  const { theme } = useTheme();
  const folder = theme === 'light' ? 'Light' : 'Dark';
  const containerRef = useRef<HTMLDivElement>(null);
  const leavesRef = useRef<Leaf[]>([]);
  const rafRef = useRef<number>(0);
  const nextId = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let w = window.innerWidth, h = window.innerHeight;

    const spawnLeaf = () => {
      const icon = LEAF_ICONS[Math.floor(Math.random() * LEAF_ICONS.length)];
      const el = document.createElement('img');
      el.src = `/assets/${folder}/${icon}`;
      el.style.cssText = 'position:absolute;width:28px;height:28px;pointerEvents:none;userSelect:none;';
      container.appendChild(el);

      const fromRight = Math.random() > 0.5;
      const leaf: Leaf = {
        id: nextId.current++,
        icon, el,
        x: fromRight ? w + 20 : -20,
        y: Math.random() * h * 0.7,
        vx: fromRight ? -(1.2 + Math.random() * 1.5) : (1.2 + Math.random() * 1.5),
        vy: 0.4 + Math.random() * 0.6,
        rot: Math.random() * 360,
        rotV: (Math.random() - 0.5) * 3,
        opacity: 0,
        life: 0,
        maxLife: 300 + Math.floor(Math.random() * 200),
      };
      leavesRef.current.push(leaf);
    };

    let spawnTimer = 0;
    const SPAWN_INTERVAL = 180; // frames between spawns

    const tick = () => {
      w = window.innerWidth; h = window.innerHeight;
      spawnTimer++;
      if (spawnTimer >= SPAWN_INTERVAL && leavesRef.current.length < LEAF_COUNT) {
        spawnTimer = 0;
        spawnLeaf();
      }

      leavesRef.current = leavesRef.current.filter(leaf => {
        leaf.life++;
        // Fade in/out
        const fadeIn = Math.min(1, leaf.life / 40);
        const fadeOut = Math.max(0, 1 - (leaf.life - (leaf.maxLife - 60)) / 60);
        leaf.opacity = fadeIn * fadeOut;

        // Gentle sinusoidal drift
        leaf.x += leaf.vx + Math.sin(leaf.life * 0.05) * 0.4;
        leaf.y += leaf.vy + Math.sin(leaf.life * 0.08) * 0.3;
        leaf.rot += leaf.rotV;

        leaf.el.style.transform = `translate(${leaf.x}px,${leaf.y}px) rotate(${leaf.rot}deg)`;
        leaf.el.style.opacity = String(leaf.opacity.toFixed(2));

        if (leaf.life >= leaf.maxLife || leaf.x < -60 || leaf.x > w + 60 || leaf.y > h + 60) {
          leaf.el.remove();
          return false;
        }
        return true;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      leavesRef.current.forEach(l => l.el.remove());
      leavesRef.current = [];
    };
  }, [folder]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
        overflow: 'hidden',
      }}
    />
  );
}
