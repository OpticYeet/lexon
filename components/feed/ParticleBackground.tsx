"use client";

import { useEffect, useRef } from "react";

interface ParticleTheme {
  bg: string;
  text: string;
  muted: string;
  accent: string;
  [key: string]: string;
}

export function ParticleBackground({ theme }: { theme: ParticleTheme }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      opacityDir: number;
      useAccent: boolean;
    }

    function hexToRgb(hex: string) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
        : { r: 26, g: 26, b: 24 };
    }

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function createParticles() {
      particles = [];
      const count = 45;
      for (let i = 0; i < count; i++) {
        const side = Math.random() > 0.5;
        const x = side
          ? canvas!.width * (0.82 + Math.random() * 0.18)
          : canvas!.width * Math.random() * 0.18;

        particles.push({
          x,
          y: Math.random() * canvas!.height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: -0.15 - Math.random() * 0.35,
          size: 1 + Math.random() * 2.5,
          opacity: Math.random() * 0.2,
          opacityDir: (Math.random() - 0.5) * 0.003,
          useAccent: Math.random() > 0.7,
        });
      }
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const t = themeRef.current;
      const textRgb = hexToRgb(t.text);
      const accentRgb = hexToRgb(t.accent);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity += p.opacityDir;

        if (p.opacity <= 0.02 || p.opacity >= 0.2) {
          p.opacityDir *= -1;
        }

        if (p.y < -10) {
          p.y = canvas!.height + 10;
          const side = Math.random() > 0.5;
          p.x = side
            ? canvas!.width * (0.82 + Math.random() * 0.18)
            : canvas!.width * Math.random() * 0.18;
        }

        const rgb = p.useAccent ? accentRgb : textRgb;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${p.opacity})`;
        ctx!.fill();
      }

      animationId = requestAnimationFrame(animate);
    }

    resize();
    createParticles();
    animate();

    const onResize = () => { resize(); createParticles(); };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
      style={{ opacity: 0.7 }}
    />
  );
}
