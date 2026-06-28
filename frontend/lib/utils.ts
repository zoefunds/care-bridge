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
    case "green":
    case "low":
    case "self_care":
    case "self-care":
      return "text-green-700 bg-green-50 border-green-200";
    case "red":
    case "high":
    case "critical":
    case "emergency":
    case "urgent":
      return "text-red-700 bg-red-50 border-red-200";
    case "yellow":
    case "moderate":
    case "soon":
    case "primary_care":
      return "text-amber-700 bg-amber-50 border-amber-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
}

export function getRiskLabel(level: string | null | undefined) {
  switch (level?.toLowerCase()) {
    case "green":
    case "low":
    case "self_care":
    case "self-care":
      return "Self-Care";
    case "yellow":
    case "moderate":
    case "soon":
    case "primary_care":
      return "Medical Review Recommended";
    case "red":
    case "high":
    case "critical":
    case "emergency":
    case "urgent":
      return "Urgent Attention Recommended";
    default:
      return level ? String(level).replace(/_/g, " ") : "Pending";
  }
}
