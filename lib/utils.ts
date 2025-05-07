import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertTimestampToSeconds(timestamp: string): number {
  // Try HH:MM:SS format first
  let match = timestamp.match(/\[(\d{2}):(\d{2}):(\d{2})\]/)
  if (match) {
    const [_, hours, minutes, seconds] = match
    return Number.parseInt(hours) * 3600 + Number.parseInt(minutes) * 60 + Number.parseInt(seconds)
  }

  // Try MM:SS format
  match = timestamp.match(/\[(\d{2}):(\d{2})\]/)
  if (match) {
    const [_, minutes, seconds] = match
    return Number.parseInt(minutes) * 60 + Number.parseInt(seconds)
  }

  return 0
}

export function convertMessageContentToHTML(content: string, videoId: string): string {
  // Replace both HH:MM:SS and MM:SS format timestamps with clickable links
  return content
    .replace(/\[(\d{2}:\d{2}:\d{2})\]/g, (match, timestamp) => {
      const seconds = convertTimestampToSeconds(match)
      return `<a href="#" onclick="event.preventDefault(); window.seekToTime(${seconds})" class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium">${match}</a>`
    })
    .replace(/\[(\d{2}):(\d{2})\]/g, (match, timestamp) => {
      const seconds = convertTimestampToSeconds(match)
      return `<a href="#" onclick="event.preventDefault(); window.seekToTime(${seconds})" class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium">${match}</a>`
    })
}
