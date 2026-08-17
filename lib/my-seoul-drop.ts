const DEFAULT_MY_SEOUL_DROP_URL = "https://myseouldrop.app";

export function mySeoulDropUrl(source: string): string {
  const base =
    process.env.NEXT_PUBLIC_MY_SEOUL_DROP_URL?.trim() ||
    DEFAULT_MY_SEOUL_DROP_URL;
  const url = new URL(base);
  url.searchParams.set("utm_source", "adropofseoul");
  url.searchParams.set("utm_medium", "referral");
  url.searchParams.set("utm_campaign", "my_seoul_drop_launch");
  url.searchParams.set("utm_content", source);
  return url.toString();
}
