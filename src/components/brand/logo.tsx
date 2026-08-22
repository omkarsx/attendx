import React from "react";

export interface AttendXMarkProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number | string;
  isWhite?: boolean;
}

/**
 * High-precision vector AttendX emblem mark (Circle + Stylized A + Emerald Checkmark)
 */
export function AttendXMark({
  className = "w-8 h-8",
  size,
  isWhite = false,
  ...props
}: AttendXMarkProps) {
  const circleColor = isWhite ? "#FFFFFF" : "#0F172A";
  const checkColor = "#10B981";

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="AttendX Emblem"
      role="img"
      {...props}
    >
      {/* Outer Broken Circle */}
      <path
        d="M 76 34 A 40 40 0 1 1 54 10"
        stroke={circleColor}
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Stylized 'A' Left Apex */}
      <path
        d="M 25 73 L 47 24"
        stroke={circleColor}
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Success Green Checkmark */}
      <path
        d="M 36 50 L 48 67 L 86 24"
        stroke={checkColor}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface AttendXAppIconProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  size?: number | string;
}

/**
 * Square App Icon variant (Squircle background with centered emblem)
 */
export function AttendXAppIcon({
  className = "w-12 h-12",
  size,
  ...props
}: AttendXAppIconProps) {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl bg-[#0F172A] shadow-md ${className}`}
      style={size ? { width: size, height: size } : undefined}
      {...props}
    >
      <AttendXMark className="w-3/5 h-3/5" isWhite />
    </div>
  );
}

export interface AttendXLogoProps {
  variant?: "horizontal" | "mark" | "stacked" | "icon";
  showTagline?: boolean;
  isWhite?: boolean;
  className?: string;
  markSize?: string;
  textSize?: string;
  taglineSize?: string;
}

/**
 * Primary AttendX Brand Logo Component
 */
export function AttendXLogo({
  variant = "horizontal",
  showTagline = false,
  isWhite = false,
  className = "",
  markSize = "w-9 h-9",
  textSize = "text-xl",
  taglineSize = "text-[9px]",
}: AttendXLogoProps) {
  if (variant === "mark") {
    return <AttendXMark className={markSize} isWhite={isWhite} />;
  }

  if (variant === "icon") {
    return <AttendXAppIcon className={markSize} />;
  }

  const textColor = isWhite ? "text-white" : "text-[#0F172A]";
  const taglineColor = isWhite ? "text-slate-400" : "text-[#64748B]";

  if (variant === "stacked") {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <AttendXMark className={markSize} isWhite={isWhite} />
        <div className={`mt-3 font-extrabold tracking-[0.16em] leading-none ${textSize} ${textColor}`}>
          ATTEND<span className="text-[#10B981]">X</span>
        </div>
        {showTagline && (
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="w-3 h-[1.5px] bg-[#10B981] rounded-full inline-block" />
            <span className={`font-semibold tracking-[0.14em] uppercase ${taglineSize} ${taglineColor}`}>
              Present Today, Prepared Tomorrow.
            </span>
            <span className="w-3 h-[1.5px] bg-[#10B981] rounded-full inline-block" />
          </div>
        )}
      </div>
    );
  }

  // Horizontal variant
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <AttendXMark className={`shrink-0 ${markSize}`} isWhite={isWhite} />
      <div className="flex flex-col justify-center">
        <div className={`font-extrabold tracking-[0.15em] leading-none ${textSize} ${textColor}`}>
          ATTEND<span className="text-[#10B981]">X</span>
        </div>
        {showTagline && (
          <div className="mt-1 flex items-center gap-1.5">
            <span className="w-2.5 h-[1px] bg-[#10B981] rounded-full inline-block" />
            <span className={`font-semibold tracking-[0.12em] uppercase ${taglineSize} ${taglineColor} whitespace-nowrap`}>
              Present Today, Prepared Tomorrow.
            </span>
            <span className="w-2.5 h-[1px] bg-[#10B981] rounded-full inline-block" />
          </div>
        )}
      </div>
    </div>
  );
}
