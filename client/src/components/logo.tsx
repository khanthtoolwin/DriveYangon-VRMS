interface LogoProps {
  className?: string;
  mark?: boolean;
}

/** Inline SVG brand mark — a headlight/road motif for DriveYangon. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="12" className="fill-primary" />
      <path
        d="M10 30.5C10 27.4624 12.4624 25 15.5 25H32.5C35.5376 25 38 27.4624 38 30.5V32C38 33.1046 37.1046 34 36 34H12C10.8954 34 10 33.1046 10 32V30.5Z"
        fill="white"
      />
      <path
        d="M13 25L16.5 18.5C17.2 17.2 18.6 16.4 20.1 16.4H27.9C29.4 16.4 30.8 17.2 31.5 18.5L35 25H13Z"
        fill="white"
        fillOpacity="0.92"
      />
      <circle cx="17" cy="34" r="3.4" className="fill-primary" stroke="white" strokeWidth="1.6" />
      <circle cx="31" cy="34" r="3.4" className="fill-primary" stroke="white" strokeWidth="1.6" />
      <path d="M18 22.5H30" className="stroke-primary" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Full lockup: mark + wordmark, for nav bars and headers. */
export function Logo({ className, mark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`} aria-label="DriveYangon">
      {mark && <LogoMark className="h-8 w-8 shrink-0" />}
      <span className="font-display text-lg font-bold tracking-tight text-foreground">
        Drive<span className="text-primary">Yangon</span>
      </span>
    </span>
  );
}
