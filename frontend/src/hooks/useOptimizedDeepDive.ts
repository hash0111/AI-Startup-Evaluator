"use client";

import { useEffect, useState, useRef } from "react";
import { deepDiveManager } from "@/lib/deep-dive-manager";
import type { DeepDiveData } from "@/components/deep-dive/types";
import type { SectionStatus } from "@/lib/deep-dive-manager";

interface UseOptimizedDeepDiveResult {
  data: DeepDiveData | null;
  loading: boolean;
  error: string | null;
  status: SectionStatus;
}

export function useOptimizedDeepDive(section: string): UseOptimizedDeepDiveResult {
  const [data, setData] = useState<DeepDiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SectionStatus>("idle");
  const startedRef = useRef(false);
  const sectionRef = useRef(section);

  useEffect(() => {
    sectionRef.current = section;
  }, [section]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    deepDiveManager
      .getOrGenerate(section)
      .then((d) => {
        if (sectionRef.current !== section) return;
        setData(d);
        setLoading(false);
        setStatus("ready");
      })
      .catch((err) => {
        if (sectionRef.current !== section) return;
        setError(err instanceof Error ? err.message : "Generation failed");
        setLoading(false);
        setStatus("error");
      });

    const unsub = deepDiveManager.subscribe((s, st) => {
      if (s === section) setStatus(st);
    });

    return () => {
      unsub();
      startedRef.current = false;
    };
  }, [section]);

  return { data, loading, error, status };
}
