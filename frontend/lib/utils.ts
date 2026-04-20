// frontend/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes conditionally without styling conflicts.
 * Essential for creating dynamic UI components based on user input.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}