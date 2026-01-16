"use client";

import { useState, useEffect } from "react";

export function useRailwayEnabled() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/railway-enabled')
      .then(res => res.json())
      .then(data => {
        setEnabled(data.enabled === true);
        setLoading(false);
      })
      .catch(() => {
        setEnabled(false);
        setLoading(false);
      });
  }, []);

  return { enabled: enabled === true, loading };
}
