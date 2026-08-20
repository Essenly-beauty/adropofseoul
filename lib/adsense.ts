const ADSENSE_ACCOUNT_PATTERN = /^ca-pub-\d+$/;

export function normalizeAdsenseAccount(
  value: string | undefined
): string | undefined {
  const account = value?.trim();
  return account && ADSENSE_ACCOUNT_PATTERN.test(account) ? account : undefined;
}

export function adsTxtLine(value: string | undefined): string | undefined {
  const account = normalizeAdsenseAccount(value);
  return account
    ? `google.com, ${account}, DIRECT, f08c47fec0942fa0`
    : undefined;
}
