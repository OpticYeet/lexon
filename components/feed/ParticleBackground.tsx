"use client";

import { useEffect, useRef } from "react";

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    }

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    function createParticles() {
      particles = [];
      const count = 40;
      for (let i = 0; i < count; i++) {
        // Concentrate particles on the sides (left 15% and right 15%)
        const side = Math.random() > 0.5;
        const x = side
          ? canvas!.width * (0.85 + Math.random() * 0.15)
          : canvas!.width * Math.random() * 0.15;

        particles.push({
          x,
          y: Math.random() * canvas!.height,
          vx: (Math.random() - 0.5) * 0.15,
          vy: -0.2 - Math.random() * 0.3,
          size: 1 + Math.random() * 2,
          opacity: Math.random() * 0.15,
          opacityDir: (Math.random() - 0.5) * 0.002,
        });
      }
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.opacity += p.opacityDir;

        if (p.opacity <= 0.02 || p.opacity >= 0.15) {
          p.opacityDir *= -1;
        }

        // Reset when off screen
        if (p.y < -10) {
          p.y = canvas!.height + 10;
          const side = Math.random() > 0.5;
          p.x = side
            ? canvas!.width * (0.85 + Math.random() * 0.15)
            : canvas!.width * Math.random() * 0.15;
        }

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(26, 26, 24, ${p.opacity})`;
        ctx!.fill();
      }

      animationId = requestAnimationFrame(animate);
    }

    resize();
    createParticles();
    animate();

    window.addEventListener("resize", () => {
      resize();
      createParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
