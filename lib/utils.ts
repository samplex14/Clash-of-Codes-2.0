import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function jitteredInterval(baseMs: number, jitterMs: number): number {
  return baseMs + Math.floor(Math.random() * jitterMs)
}
