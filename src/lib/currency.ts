import { currencyApi } from "./api";

export type Currency = "USD" | "EGP";

let cachedCurrency: Currency | null = null;
let cachedRate: number | null = null;
let rateExpiry: number = 0;

export async function detectUserCurrency(): Promise<Currency> {
  if (cachedCurrency) return cachedCurrency;
  try {
    const { data } = await currencyApi.detect();
    cachedCurrency = data.currency as Currency;
    return cachedCurrency;
  } catch {
    return "USD";
  }
}

export async function getExchangeRate(): Promise<number> {
  const now = Date.now();
  if (cachedRate && now < rateExpiry) return cachedRate;
  try {
    const { data } = await currencyApi.rate();
    cachedRate = data.rate;
    rateExpiry = now + 3600_000; // 1 hour
    return cachedRate!;
  } catch {
    return cachedRate || 50;
  }
}

export async function convertPrice(amountUSD: number, targetCurrency: Currency): Promise<string> {
  if (targetCurrency === "USD") {
    return formatCurrency(amountUSD, "USD");
  }
  const rate = await getExchangeRate();
  const converted = amountUSD * rate;
  return formatCurrency(converted, "EGP");
}

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === "USD") {
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${Math.round(amount).toLocaleString("en-EG")} EGP`;
}
