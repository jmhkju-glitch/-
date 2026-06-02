import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatRelativeTime(date: Date | string | number): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return formatDate(d);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + "...";
}

export function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*+]\s/gm, "")
    .replace(/^\s*\d+\.\s/gm, "")
    .replace(/\n+/g, " ")
    .trim();
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  stocks: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  macro: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  "etf-fund": { bg: "bg-pink-100", text: "text-pink-700", border: "border-pink-200" },
  strategy: { bg: "bg-sky-100", text: "text-sky-700", border: "border-sky-200" },
};

export function getCategoryStyle(slug?: string | null) {
  if (!slug) return { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" };
  return CATEGORY_COLORS[slug] ?? { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" };
}
