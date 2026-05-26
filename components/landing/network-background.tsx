"use client";

import { useEffect, useRef } from "react";

type Point = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

export function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let points: Point[] = [];
    const cursor = { x: -9999, y: -9999 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const count = Math.max(34, Math.min(76, Math.floor(width / 18)));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 1.3 + Math.random() * 1.7,
      }));
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      const gradient = context.createRadialGradient(
        width * 0.68,
        height * 0.2,
        0,
        width * 0.68,
        height * 0.2,
        width * 0.65,
      );
      gradient.addColorStop(0, "rgba(45,107,255,0.16)");
      gradient.addColorStop(0.45, "rgba(212,168,67,0.08)");
      gradient.addColorStop(1, "rgba(10,15,30,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      for (const point of points) {
        if (!reducedMotion) {
          const dx = point.x - cursor.x;
          const dy = point.y - cursor.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const pull = dist < 180 ? (180 - dist) / 180 : 0;
          point.x += point.vx + (dx / Math.max(dist, 1)) * pull * 0.22;
          point.y += point.vy + (dy / Math.max(dist, 1)) * pull * 0.22;
        }

        if (point.x < -20) point.x = width + 20;
        if (point.x > width + 20) point.x = -20;
        if (point.y < -20) point.y = height + 20;
        if (point.y > height + 20) point.y = -20;
      }

      points.forEach((a, index) => {
        for (let j = index + 1; j < points.length; j += 1) {
          const b = points[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 145) {
            context.strokeStyle = `rgba(212,168,67,${0.18 * (1 - dist / 145)})`;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          }
        }
      });

      for (const point of points) {
        context.fillStyle = "rgba(248,247,244,0.62)";
        context.beginPath();
        context.arc(point.x, point.y, point.r, 0, Math.PI * 2);
        context.fill();
      }

      animationFrame = window.requestAnimationFrame(draw);
    };

    const handlePointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      cursor.x = event.clientX - rect.left;
      cursor.y = event.clientY - rect.top;
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointer);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointer);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full opacity-90"
    />
  );
}
