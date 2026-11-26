"use client";

import { useEffect } from "react";
import { cleanupOldJobs } from "@/lib/db";

export function Boot() {
  useEffect(() => {
    void cleanupOldJobs();
  }, []);
  return null;
}
