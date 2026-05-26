"use client";

import { useEffect, useRef, useState } from "react";
import { metrics } from "./landing-data";

export function MetricsSection() {
  const ref = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-[#0A0F1E] px-4 py-20 text-white sm:px-6" data-reveal>
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(45,107,255,0.22),transparent_30%),linear-gradient(135deg,#101A31,#0A0F1E)] p-8 shadow-2xl shadow-black/20">
        <div className="grid gap-6 md:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/[0.055] p-6">
              <p className="text-[clamp(2.5rem,5vw,4.8rem)] font-semibold leading-none text-[#F8F7F4]">
                {active ? (
                  <AnimatedNumber value={metric.value} />
                ) : (
                  "0"
                )}
                {metric.suffix}
              </p>
              <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-[#D4A843]">
                {metric.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame = 0;
    const total = 46;
    const tick = () => {
      frame += 1;
      const progress = 1 - Math.pow(1 - frame / total, 3);
      setDisplay(value * Math.min(progress, 1));
      if (frame < total) window.requestAnimationFrame(tick);
    };
    tick();
  }, [value]);

  if (value % 1 !== 0) return display.toFixed(1);
  return Math.round(display).toLocaleString("en-IN");
}
