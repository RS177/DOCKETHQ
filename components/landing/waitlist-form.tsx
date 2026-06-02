"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/toast-provider";

const practiceTypes = [
  "Solo lawyer",
  "Law firm / chamber",
  "In-house legal team",
  "Legal operations",
];

export function WaitlistForm() {
  const notify = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [practiceType, setPracticeType] = useState(practiceTypes[0]);
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [website, setWebsite] = useState("");

  async function joinWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !email.trim()) {
      notify({
        title: "Name and email required",
        description: "Add your name and email so we can contact you.",
        variant: "warning",
      });
      return;
    }

    setLoading(true);

    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        city: city.trim(),
        practice_type: practiceType,
        source: "landing",
        website,
      }),
    });

    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    setLoading(false);

    if (!response.ok) {
      notify({
        title: "Could not join waitlist",
        description:
          result.error ||
          "Please try again. If this continues, email hello@dockethq.in.",
        variant: "error",
      });
      return;
    }

    setJoined(true);
    setName("");
    setEmail("");
    setCity("");
    setPracticeType(practiceTypes[0]);
    notify({
      title: "You are on the waitlist",
      description: "We will reach out when the next early-access batch opens.",
      variant: "success",
    });
  }

  return (
    <form
      onSubmit={joinWaitlist}
      className="rounded-[18px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/20"
    >
      <input
        tabIndex={-1}
        autoComplete="off"
        value={website}
        onChange={(event) => setWebsite(event.target.value)}
        className="hidden"
        aria-hidden="true"
      />

      {joined ? (
        <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-4 text-sm leading-6 text-emerald-50">
          You are on the early-access list. We will use your details only to
          contact you about DocketHQ.
        </div>
      ) : null}

      <div className="mt-0 grid gap-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/42 focus:border-[#D4A843]"
        />
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/42 focus:border-[#D4A843]"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <input
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="City"
            className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/42 focus:border-[#D4A843]"
          />
          <select
            value={practiceType}
            onChange={(event) => setPracticeType(event.target.value)}
            className="w-full rounded-md border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-[#D4A843]"
          >
            {practiceTypes.map((type) => (
              <option key={type} value={type} className="bg-[#0A0F1E]">
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        disabled={loading}
        className="group relative mt-4 inline-flex w-full items-center justify-center overflow-hidden rounded-md bg-[#2D6BFF] px-6 py-4 font-bold text-white transition hover:-translate-y-1 disabled:opacity-60"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition duration-700 group-hover:translate-x-full" />
        <span className="relative inline-flex items-center gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              Join the waitlist
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </span>
      </button>

      <p className="mt-3 text-xs leading-5 text-white/45">
        No spam. No launch noise. Just early access when the case-tracking MVP
        is ready for more users.
      </p>
    </form>
  );
}
