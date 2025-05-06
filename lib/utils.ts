import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function convertTimestampToSeconds(timestamp: string): number {
  const match = timestamp.match(/\[(\d{2}):(\d{2}):(\d{2})\]/);
  if (!match) return 0;
  
  const [_, hours, minutes, seconds] = match;
  return (
    parseInt(hours) * 3600 +
    parseInt(minutes) * 60 +
    parseInt(seconds)
  );
}

export function convertMessageContentToHTML(content: string, videoId: string): string {
  // Replace timestamps [HH:MM:SS] with clickable links
  return content.replace(
    /\[(\d{2}:\d{2}:\d{2})\]/g,
    (match, timestamp) => {
      const seconds = convertTimestampToSeconds(match);
      return `<a href="https://youtu.be/${videoId}?t=${seconds}" target="_blank" class="text-blue-600 hover:text-blue-800 hover:underline">${match}</a>`;
    }
  );
}
