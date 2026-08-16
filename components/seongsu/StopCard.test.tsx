import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StopCard } from "./StopCard";
import type { Stop } from "@/lib/seongsu/courses";

const stop = {
  id: "nonfiction",
  n: 1,
  time: "11:00 AM",
  part: "Morning",
  nameEn: "Nonfiction Seongsu",
  nameKr: "논픽션 성수",
  category: "Fragrance flagship",
  emoji: "🧴",
  rating: 5.0,
  reviewCount: 22,
  lat: 37.5437945,
  lng: 127.0504107,
  placeId: "ChIJSzsYAwClfDURZ-TRKwKg2sM",
  price: "₩₩₩ · perfume & home scent",
  waiting: "Minor entry queue at peak",
  breakTime: "None",
  closed: "Open daily · 11:00–20:30",
  english: "Excellent — staff fluent in English",
  nearby: "Tamburins (2 min)",
  verdict: "The most tourist-friendly perfume house in Seongsu.",
  reviews: "Reviewers overwhelmingly single out the staff.",
} as Stop;

describe("StopCard", () => {
  it("keeps the Korean name out of the heading", () => {
    render(<StopCard stop={stop} />);

    expect(
      screen.getByRole("heading", { name: "Nonfiction Seongsu" })
    ).not.toBeNull();
    expect(screen.getByText("논픽션 성수")).not.toBeNull();
  });

  // globals.css sets `h1,h2,h3 { @apply font-serif }` in the base layer, so the
  // sans face has to be asked for explicitly or it silently reverts.
  it("sets the stop name in the sans face", () => {
    render(<StopCard stop={stop} />);

    const heading = screen.getByRole("heading", { name: "Nonfiction Seongsu" });
    expect(heading.className).toContain("font-sans");
  });

  it("keeps a Korean name from breaking mid-word", () => {
    render(<StopCard stop={{ ...stop, nameKr: "오오네일 성수" }} />);

    expect(screen.getByText("오오네일 성수").className).toContain("break-keep");
  });

  it("shows the rating, category, and map links", () => {
    render(<StopCard stop={stop} />);

    expect(screen.getByText("5.0")).toBeTruthy();
    expect(screen.getByText(/Fragrance flagship/)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Google Maps/ }).getAttribute("href")
    ).toContain("ChIJSzsYAwClfDURZ-TRKwKg2sM");
  });
});
