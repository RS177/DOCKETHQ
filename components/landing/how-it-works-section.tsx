import { steps } from "./landing-data";

export function HowItWorksSection() {
  return (
    <section id="workflow" className="bg-[#0A0F1E] px-4 py-24 text-white sm:px-6" data-reveal>
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#D4A843]">
            How it works
          </p>
          <h2 className="mt-4 text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[0.98] tracking-tight">
            From intake to verdict, the chain stays visible.
          </h2>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={step.title}
                className="group relative rounded-[18px] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/15 transition hover:-translate-y-1 hover:border-[#D4A843]/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D4A843]/25 bg-[#D4A843]/10 text-[#D4A843] transition group-hover:scale-105">
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="font-mono text-sm text-white/42">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-8 text-2xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/62">{step.copy}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
