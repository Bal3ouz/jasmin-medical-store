import type { SVGProps } from "react";

export function JasmineSprig({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path
        d="M8 56 C 18 36, 28 28, 40 22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <g fill="currentColor">
        <circle cx="40" cy="22" r="3.6" />
        <circle cx="46" cy="16" r="2.6" />
        <circle cx="34" cy="14" r="2.4" />
        <circle cx="50" cy="22" r="2.2" />
      </g>
      <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none">
        <path d="M22 38 q-4 -2 -8 0" />
        <path d="M28 32 q-4 -3 -10 -1" />
      </g>
    </svg>
  );
}
