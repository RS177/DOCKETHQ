import { firmLogos } from "./landing-data";

export function SocialProofSection() {
  const logos = [...firmLogos, ...firmLogos];

  return (
    <section className="overflow-hidden border-y border-[#E8DCC8] bg-[#F8F7F4] py-6">
      <div className="mx-auto mb-4 max-w-7xl px-4 text-xs font-bold uppercase tracking-[0.2em] text-[#8B6A32] sm:px-6">
        Trusted by litigation teams, legal ops, and serious solo practices
      </div>
      <div className="dhq-marquee flex gap-4 whitespace-nowrap">
        {logos.map((logo, index) => (
          <div
            key={`${logo}-${index}`}
            className="inline-flex min-w-[220px] items-center justify-center rounded-md border border-[#E2D5BD] bg-white/70 px-6 py-4 text-sm font-bold uppercase tracking-[0.14em] text-[#0A0F1E]/70 shadow-sm"
          >
            {logo}
          </div>
        ))}
      </div>
    </section>
  );
}
