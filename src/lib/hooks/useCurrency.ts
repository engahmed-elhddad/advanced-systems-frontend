"use client";
import { useState, useEffect, useCallback } from "react";
import { Currency, detectUserCurrency, convertPrice, formatCurrency, getExchangeRate } from "@/lib/currency";

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [rate, setRate] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const [detectedCurrency, exchangeRate] = await Promise.all([
        detectUserCurrency(),
        getExchangeRate(),
      ]);
      setCurrency(detectedCurrency);
      setRate(exchangeRate);
      setLoading(false);
    }
    init();
  }, []);

  const format = useCallback(
    (amountUSD: number | null | undefined): string => {
      if (amountUSD == null) return "Request Quote";
      if (currency === "USD") return formatCurrency(amountUSD, "USD");
      return formatCurrency(amountUSD * rate, "EGP");
    },
    [currency, rate]
  );

  const toggle = useCallback(() => {
    setCurrency((c) => (c === "USD" ? "EGP" : "USD"));
  }, []);

  return { currency, rate, format, toggle, loading };
}
