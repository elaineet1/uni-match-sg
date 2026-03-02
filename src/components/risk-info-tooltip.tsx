interface RiskInfoTooltipProps {
  className?: string;
}

export function RiskInfoTooltip({ className = "" }: RiskInfoTooltipProps) {
  return (
    <details className={className}>
      <summary className="cursor-pointer text-xs text-blue-700 hover:underline">
        How risk is estimated
      </summary>
      <p className="mt-1 text-xs text-gray-600">
        This is an advisory estimate based on course tags and typical roles. It
        reflects automation exposure, not whether jobs will disappear.
      </p>
    </details>
  );
}
