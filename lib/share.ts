// Share-channel URL builders. Every channel is a plain URL scheme — no SDKs.
// Each shared link carries utm_source=share&utm_medium=<channel> so GA can
// attribute inbound traffic per channel; the page's canonical tag keeps UTM
// params out of SEO.

export type ShareChannel = {
  key: string;
  label: string;
  href: (url: string, title: string, imageUrl?: string) => string;
};

export function withUtm(url: string, medium: string): string {
  const u = new URL(url);
  u.searchParams.set("utm_source", "share");
  u.searchParams.set("utm_medium", medium);
  return u.toString();
}

const enc = encodeURIComponent;

export const SHARE_CHANNELS: ShareChannel[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    href: (url, title) =>
      `https://wa.me/?text=${enc(`${title} ${withUtm(url, "whatsapp")}`)}`,
  },
  {
    key: "pinterest",
    label: "Pinterest",
    href: (url, title, imageUrl) =>
      `https://www.pinterest.com/pin/create/button/?url=${enc(withUtm(url, "pinterest"))}&description=${enc(title)}${imageUrl ? `&media=${enc(imageUrl)}` : ""}`,
  },
  {
    key: "x",
    label: "X",
    href: (url, title) =>
      `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(withUtm(url, "x"))}`,
  },
  {
    key: "threads",
    label: "Threads",
    href: (url, title) =>
      `https://www.threads.net/intent/post?text=${enc(`${title} ${withUtm(url, "threads")}`)}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    href: (url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${enc(withUtm(url, "facebook"))}`,
  },
  {
    key: "reddit",
    label: "Reddit",
    href: (url, title) =>
      `https://www.reddit.com/submit?url=${enc(withUtm(url, "reddit"))}&title=${enc(title)}`,
  },
  {
    key: "line",
    label: "LINE",
    href: (url) =>
      `https://social-plugins.line.me/lineit/share?url=${enc(withUtm(url, "line"))}`,
  },
  {
    key: "telegram",
    label: "Telegram",
    href: (url, title) =>
      `https://t.me/share/url?url=${enc(withUtm(url, "telegram"))}&text=${enc(title)}`,
  },
  {
    key: "email",
    label: "Email",
    href: (url, title) =>
      `mailto:?subject=${enc(title)}&body=${enc(withUtm(url, "email"))}`,
  },
];
