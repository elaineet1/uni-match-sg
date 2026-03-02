"use client";

import { useMemo } from "react";
import { useAppStore } from "@/lib/store";

interface CompareToggleButtonProps {
  slug: string;
}

export function CompareToggleButton({ slug }: CompareToggleButtonProps) {
  const selectedCourseSlugs = useAppStore((s) => s.selectedCourseSlugs);
  const toggleCompareCourse = useAppStore((s) => s.toggleCompareCourse);

  const isSelected = selectedCourseSlugs.includes(slug);
  const atLimit = selectedCourseSlugs.length >= 5;

  const buttonText = useMemo(() => {
    if (isSelected) return "Selected for Compare";
    if (atLimit) return "Compare List Full";
    return "Add to Compare";
  }, [isSelected, atLimit]);

  return (
    <button
      type="button"
      onClick={() => toggleCompareCourse(slug)}
      disabled={!isSelected && atLimit}
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
        isSelected
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      }`}
    >
      {buttonText}
    </button>
  );
}
