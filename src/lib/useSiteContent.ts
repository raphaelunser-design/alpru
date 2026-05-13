"use client";

import { useEffect, useState } from "react";

type ContentValue = Record<string, string>;

export function useSiteContent<T extends ContentValue>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/content?key=${encodeURIComponent(key)}`);
        if (!res.ok) return;
        const json = await res.json();
        const row = (json.data || [])[0];
        if (row?.value && mounted) {
          setValue((current) => ({ ...current, ...(row.value as ContentValue) } as T));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    run();
    return () => {
      mounted = false;
    };
  }, [key]);

  return { value, loading };
}
