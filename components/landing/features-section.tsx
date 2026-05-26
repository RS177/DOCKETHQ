import { features } from "./landing-data";

export function FeaturesSection() {
  return (
    <section id="features" className="bg-[#F8F7F4] px-4 py-24 sm:px-6" data-reveal>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#8B6A32]">
              Core features
            </p>
            <h2 className="mt-4 max-w-3xl text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[0.98] tracking-tight text-[#0A0F1E]">
              Every deadline. Every filing. Every case. Covered.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-[#5E6A7D]">
            Built specifically for litigation work: dockets, motions, hearings,
            discovery, filings, reminders, and jurisdiction-sensitive dates.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const wide = index === 0 || index === 5;
            return (
              <article
                key={feature.title}
                className={`group relative overflow-hidden rounded-[18px] border border-[#E2D5BD] bg-white p-6 shadow-xl shadow-[#CBB98F]/10 transition duration-300 hover:-translate-y-1 hover:border-[#D4A843]/55 hover:shadow-2xl ${
                  wide ? "lg:col-span-3" : "lg:col-span-2"
                }`}
              >
                <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${feature.accent}`} />
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#E6D7BD] bg-[#F8F7F4] text-[#8B6A32] transition group-hover:rotate-3 group-hover:scale-105">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-8 text-2xl font-semibold tracking-tight text-[#0A0F1E]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[#5E6A7D]">
                    {feature.copy}
                  </p>
                  <div className="mt-8 grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((item) => (
                      <span
                        key={item}
                        className="h-2 rounded-full bg-gradient-to-r from-[#D4A843]/70 to-[#2D6BFF]/50 opacity-70 transition group-hover:opacity-100"
                        style={{ width: `${56 + item * 18}%` }}
                      />
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
