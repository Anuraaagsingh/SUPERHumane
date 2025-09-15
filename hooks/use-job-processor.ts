"use client"

import { useEffect } from "react"
import { jobProcessor } from "@/lib/jobs/processor"

export function useJobProcessor() {
  useEffect(() => {
    // Start job processor when component mounts
    jobProcessor.start()

    // Cleanup on unmount
    return () => {
      jobProcessor.stop()
    }
  }, [])
}
