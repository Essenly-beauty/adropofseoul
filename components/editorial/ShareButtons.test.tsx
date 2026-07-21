import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShareButtons } from "./ShareButtons";
import { SITE_URL } from "@/lib/site";

describe("ShareButtons", () => {
  it("renders copy + primary channels, hides secondary behind More", () => {
    render(<ShareButtons path="/places/soo" title="Soo Head Spa" />);
    expect(screen.getByText("Copy Link")).toBeTruthy();
    expect(screen.getByText("WhatsApp")).toBeTruthy();
    expect(screen.getByText("Pinterest")).toBeTruthy();
    expect(screen.getByText("X")).toBeTruthy();
    expect(screen.getByText("More +")).toBeTruthy();
    expect(screen.queryByText("Reddit")).toBe(null);
    expect(screen.queryByText("LINE")).toBe(null);
  });

  it("expands More to reveal all secondary channels", () => {
    render(<ShareButtons path="/places/soo" title="Soo Head Spa" />);
    fireEvent.click(screen.getByText("More +"));
    for (const label of [
      "Threads",
      "Facebook",
      "Reddit",
      "LINE",
      "Telegram",
      "Email",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(screen.queryByText("More +")).toBe(null);
  });

  it("channel links are absolute, UTM-tagged, and open in a new tab", () => {
    render(<ShareButtons path="/places/soo" title="Soo Head Spa" />);
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
    fireEvent.click(screen.getByText("Copy Link"));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain("utm_medium=copy");
    expect(await screen.findByText("Copied ✓")).toBeTruthy();
  });

  it("shows native Share button only when navigator.share exists", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { share });
    render(<ShareButtons path="/places/soo" title="Soo Head Spa" />);
    const btn = await screen.findByText("Share…");
    fireEvent.click(btn);
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
