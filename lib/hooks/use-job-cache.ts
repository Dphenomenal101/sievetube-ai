"use client"

import { useLocalStorage } from "./use-local-storage"

interface JobState {
  downloadJobId: string | null
  status: "processing" | "finished" | "failed"
  lastChecked: number
  subtitles?: string
}

interface JobCache {
  [videoId: string]: JobState
}

export function useJobCache() {
  const [jobCache, setJobCache] = useLocalStorage<JobCache>("sievetube-job-cache", {})

  const getJobState = (videoId: string): JobState | null => {
    return jobCache[videoId] || null
  }

  const setJobState = (videoId: string, state: JobState) => {
    setJobCache((prev) => ({
      ...prev,
      [videoId]: state,
    }))
  }

  const clearJobState = (videoId: string) => {
    setJobCache((prev) => {
      const newCache = { ...prev }
      delete newCache[videoId]
      return newCache
    })
  }

  const clearAllJobs = () => {
    setJobCache({})
  }

  return {
    jobCache,
    getJobState,
    setJobState,
    clearJobState,
    clearAllJobs,
  }
} 