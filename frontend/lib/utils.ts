import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getRiskColor(level: string | null | undefined) {
  switch (level?.toLowerCase()) {
    case "green": return "text-triage-green bg-green-50 border-green-200";
    case "red":   return "text-triage-red bg-red-50 border-red-200";
    case "yellow": return "text-triage-yellow bg-yellow-50 border-yellow-200";
    default:       return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getRiskLabel(level: string | null | undefined) {
  switch (level?.toLowerCase()) {
    case "green":  return "Self-Care";
    case "yellow": return "Medical Review Recommended";
    case "red":    return "Urgent Attention Recommended";
    default:       return "Pending";
  }
}
