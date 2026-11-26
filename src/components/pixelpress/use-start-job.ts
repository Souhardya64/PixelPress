"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createJob } from "@/lib/jobs";

export function useStartJob(toolId: string) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const start = useCallback(
    async (files: File[], options: Record<string, unknown>) => {
      if (starting) return;
      setStarting(true);
      try {
        const job = await createJob(toolId, files, options);
        router.push(`/process/${toolId}/${job.id}`);
      } catch {
        setStarting(false);
        toast.error("Could not start the job — browser storage may be unavailable in this context.");
      }
    },
    [router, starting, toolId]
  );

  return { start, starting };
}
