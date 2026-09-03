"use client";

import { useState } from "react";

type Step = "browse" | "signin" | "personalize" | "saved";

const interests = [
  "K-beauty shopping",
  "Skin clinics",
  "Hair salons",
  "Nails & lashes",
  "Personal color",
  "Head spa & scalp care",
  "Malls, gifts & souvenirs",
];

const places = [
  {
    area: "SEONGSU",
    title: "Amore Seongsu",
    type: "Beauty flagship",
    copy: "A calm, try-before-you-buy stop for discovering Amorepacific brands.",
    tone: "bg-[#dfe6dc]",
    mark: "AM",
  },
  {
    area: "HANNAM",
    title: "Jung Saem Mool Plops",
    type: "Makeup & café",
    copy: "A makeup playground with artist-led products and a rooftop pause.",
    tone: "bg-[#eadbd4]",
    mark: "JM",
  },
  {
    area: "GANGNAM",
    title: "Toun28 Dosan",
    type: "Skincare flagship",
    copy: "Ingredient-conscious skincare in a tactile, gallery-like space.",
    tone: "bg-[#e8e3d4]",
    mark: "28",
  },
];

function GoogleMark() {
  return (
    <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-sm font-bold text-[#4285f4]">
      G
    </span>
  );
}

export function MemberFlowPreview() {
  const [step, setStep] = useState<Step>("browse");
  const [journey, setJourney] = useState("I’m planning a trip");
  const [selected, setSelected] = useState<string[]>([
    "K-beauty shopping",
    "Personal color",
  ]);

  const toggleInterest = (interest: string) => {
    setSelected((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    );
  };

  const finish = () => {
    setStep("saved");
    window.setTimeout(() => setStep("browse"), 2800);
  };

  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#25231f]">
      <section className="mx-auto max-w-[1180px] px-5 pb-24 pt-10 sm:px-8 sm:pt-16">
        <div className="mb-12 flex flex-col justify-between gap-5 border-b border-[#d8d1c5] pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#987257]">
              Interactive concept preview
            </p>
            <h1 className="max-w-3xl text-4xl leading-[0.95] sm:text-6xl">
              Find your Seoul,
              <br />
              save it as you go.
            </h1>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[#716b62]">
            Browse freely. When you find somewhere worth remembering, one simple
            sign-in keeps it safe across devices.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#987257]">
              Editor’s shortlist
            </p>
            <h2 className="mt-1 text-2xl">Beauty stops worth saving</h2>
          </div>
          <span className="hidden rounded-full border border-[#d8d1c5] px-4 py-2 text-xs text-[#716b62] sm:block">
            Browsing as a guest
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {places.map((place, index) => (
            <article
              key={place.title}
              className="overflow-hidden rounded-[18px] border border-[#d8d1c5] bg-[#fbfaf7]"
            >
              <div
                className={`relative grid h-44 place-items-center ${place.tone}`}
              >
                <span className="font-serif text-5xl text-black/20">
                  {place.mark}
                </span>
                <button
                  type="button"
                  aria-label={`Save ${place.title}`}
                  onClick={() => index === 0 && setStep("signin")}
                  className={`absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full border transition ${
                    index === 0
                      ? "border-white/80 bg-white text-[#9b5f55] shadow-sm hover:scale-105"
                      : "cursor-default border-white/60 bg-white/70 text-[#6e6a63]"
                  }`}
                >
                  {step === "saved" && index === 0 ? "♥" : "♡"}
                </button>
              </div>
              <div className="p-5">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-[#987257]">
                  {place.area}
                </p>
                <h3 className="mt-2 font-sans text-lg font-semibold">
                  {place.title}
                </h3>
                <p className="mt-1 text-xs text-[#8a847a]">{place.type}</p>
                <p className="mt-3 text-sm leading-6 text-[#716b62]">
                  {place.copy}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-5 text-center text-xs text-[#8a847a]">
          Try it: tap the heart on Amore Seongsu
        </p>
      </section>

      {step !== "browse" && step !== "saved" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#25231f]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6">
          {step === "signin" ? (
            <section className="w-full max-w-[440px] rounded-t-[28px] bg-[#fbfaf7] p-7 shadow-2xl sm:rounded-[28px] sm:p-9">
              <div className="mb-8 flex items-start justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#eadbd4] text-xl text-[#9b5f55]">
                  ♥
                </span>
                <button
                  type="button"
                  onClick={() => setStep("browse")}
                  className="text-2xl leading-none text-[#8a847a]"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#987257]">
                Keep this place
              </p>
              <h2 className="mt-3 text-4xl leading-none">
                Save your Seoul finds.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[#716b62]">
                Sign in once to save Amore Seongsu and find it later on any
                device.
              </p>
              <button
                type="button"
                onClick={() => setStep("personalize")}
                className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-[#292722] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#9b5f55]"
              >
                <GoogleMark /> Continue with Google
              </button>
              <p className="mt-5 text-center text-[11px] leading-5 text-[#8a847a]">
                By continuing, you agree to the Terms of Service and Privacy
                Policy.
              </p>
            </section>
          ) : (
            <section className="max-h-[92vh] w-full max-w-[640px] overflow-y-auto rounded-t-[28px] bg-[#fbfaf7] p-6 shadow-2xl sm:rounded-[28px] sm:p-9">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#987257]">
                    Optional · About 20 seconds
                  </p>
                  <h2 className="mt-2 text-3xl sm:text-4xl">Make it yours.</h2>
                  <p className="mt-2 text-sm text-[#716b62]">
                    We’ll use this to put the most useful Seoul picks first.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={finish}
                  className="text-sm text-[#8a847a] underline underline-offset-4"
                >
                  Skip
                </button>
              </div>

              <fieldset className="mt-8">
                <legend className="text-sm font-semibold">
                  Where are you in your Seoul journey?
                </legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[
                    "I’m in Seoul now",
                    "I’m planning a trip",
                    "I live in Seoul",
                    "Just exploring",
                  ].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setJourney(option)}
                      className={`rounded-xl border px-4 py-3 text-left text-sm transition ${journey === option ? "border-[#9b5f55] bg-[#f2e6e1] text-[#7c4942]" : "border-[#d8d1c5] hover:border-[#aaa194]"}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-7">
                <legend className="text-sm font-semibold">
                  What are you interested in?
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`rounded-full border px-4 py-2.5 text-xs transition ${selected.includes(interest) ? "border-[#9b5f55] bg-[#9b5f55] text-white" : "border-[#d8d1c5] hover:border-[#aaa194]"}`}
                    >
                      {selected.includes(interest) ? "✓ " : "+ "}
                      {interest}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button
                type="button"
                onClick={finish}
                className="mt-8 w-full rounded-full bg-[#292722] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#9b5f55]"
              >
                Personalize my Seoul Drop
              </button>
            </section>
          )}
        </div>
      )}

      {step === "saved" && (
        <div className="fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 items-center gap-3 rounded-2xl bg-[#292722] px-5 py-4 text-sm text-white shadow-xl">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#9b5f55]">
            ✓
          </span>
          <span>
            <strong>Amore Seongsu saved.</strong>
            <br />
            <span className="text-white/65">Added to My Seoul Drop</span>
          </span>
        </div>
      )}
    </main>
  );
}
