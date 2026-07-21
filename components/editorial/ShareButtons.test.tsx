import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShareButtons } from "./ShareButtons";
import { SITE_URL } from "@/lib/site";

const ALL_CHANNELS = [
  "WhatsApp",
  "Pinterest",
  "X",
  "Threads",
  "Facebook",
  "Reddit",
  "LINE",
  "Telegram",
  "Email",
];

function openMenu() {
  fireEvent.click(screen.getByRole("button", { name: "Share" }));
}

describe("ShareButtons", () => {
  it("renders only the Share trigger until clicked", () => {
    render(<ShareButtons path="/places/soo" title="Soo Head Spa" />);
    expect(screen.getByRole("button", { name: "Share" })).toBeTruthy();
    expect(screen.queryByRole("menu")).toBe(null);
    expect(screen.queryByText("WhatsApp")).toBe(null);
    expect(screen.queryByText("Copy Link")).toBe(null);
  });

  it("opens a menu listing copy + every channel", () => {
    render(<ShareButtons path="/places/soo" title="Soo Head Spa" />);
    openMenu();
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByText("Copy Link")).toBeTruthy();
    for (const label of ALL_CHANNELS) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("every menu item carries an icon", () => {
    render(<ShareButtons path="/places/soo" title="Soo Head Spa" />);
    openMenu();
    for (const item of screen.getAllByRole("menuitem")) {
      expect(item.querySelector("svg")).toBeTruthy();
    }
  });

  it("channel links are absolute, UTM-tagged, and open in a new tab", () => {
    render(<ShareButtons path="/places/soo" title="Soo Head Spa" />);
    openMenu();
    const wa = screen.getByText("WhatsApp").closest("a")!;
    expect(wa.getAttribute("target")).toBe("_blank");
    expect(wa.getAttribute("rel")).toContain("noopener");
    const decoded = decodeURIComponent(wa.getAttribute("href")!);
    expect(decoded).toContain(`${SITE_URL}/places/soo`);
    expect(decoded).toContain("utm_medium=whatsapp");
  });

  it("copies a UTM-tagged link and shows Copied state", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<ShareButtons path="/places/soo" title="Soo Head Spa" />);
    openMenu();
    fireEvent.click(screen.getByText("Copy Link"));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain("utm_medium=copy");
    expect(await screen.findByText("Copied ✓")).toBeTruthy();
  });

  it("closes on Escape and on outside click", () => {
    render(<ShareButtons path="/places/soo" title="Soo Head Spa" />);
    openMenu();
    expect(screen.getByRole("menu")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBe(null);
    openMenu();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).toBe(null);
  });

  it("shows the native share item only when navigator.share exists", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { share });
    render(<ShareButtons path="/places/soo" title="Soo Head Spa" />);
    openMenu();
    const item = await screen.findByText("Share via…");
    fireEvent.click(item);
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Soo Head Spa",
        url: expect.stringContaining("utm_medium=native"),
      })
    );
    // @ts-expect-error cleanup test-injected global
    delete navigator.share;
  });
});
