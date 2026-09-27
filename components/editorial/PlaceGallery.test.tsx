import { describe, it, expect, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PlaceGallery } from "./PlaceGallery";

afterEach(cleanup);

const photos = [
  { src: "/images/places/one.jpg", alt: "Salon interior" },
  { src: "/images/places/two.jpg", alt: "Salon entrance" },
];

describe("PlaceGallery", () => {
  it("switches the main photo and announces the selection", () => {
    render(<PlaceGallery name="Salon" photos={photos} />);
    expect(screen.getByRole("img", { name: "Salon interior" })).toBeTruthy();
    const next = screen.getByRole("button", { name: "Show photo 2 of 2" });
    fireEvent.click(next);
    expect(screen.getByRole("img", { name: "Salon entrance" })).toBeTruthy();
    expect(next.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("2 / 2 photos")).toBeTruthy();
  });

  it("does not leave an empty photo region or controls without photos", () => {
    const { container } = render(<PlaceGallery name="Salon" photos={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows a single photo without redundant thumbnail controls", () => {
    render(<PlaceGallery name="Salon" photos={photos.slice(0, 1)} />);
    expect(screen.getByRole("img", { name: "Salon interior" })).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("keeps navigation working after an image fails", () => {
    render(<PlaceGallery name="Salon" photos={photos} />);
    fireEvent.error(screen.getByRole("img", { name: "Salon interior" }));
    expect(screen.getByText("Photo unavailable")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show photo 2 of 2" }));
    expect(screen.getByRole("img", { name: "Salon entrance" })).toBeTruthy();
    expect(screen.queryByText("Photo unavailable")).toBeNull();
  });
});
