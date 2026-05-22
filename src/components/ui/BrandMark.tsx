interface BrandMarkProps {
  size?: number;
  className?: string;
}

/** VCEquityNote 브랜드 마크 — 뼈에 붙은 스테이크(meat). "stake"의 중의적 표현. 사각형 색은 currentColor. */
export function BrandMark({ size = 28, className = '' }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="VCEquityNote"
    >
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <path d="M13 17.5 7.5 22.5" stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="6.6" cy="21.3" r="2.1" fill="#ffffff" />
      <circle cx="8.4" cy="23.4" r="2.1" fill="#ffffff" />
      <path
        d="M16.5 7.2c5.6-.6 9.8 2.4 9.8 7.4 0 5.4-4.6 9-10.4 8.4-4-.4-7-2.7-7.4-6.3-.5-4.8 2.8-9 8-9.5Z"
        fill="#ffffff"
      />
      <path
        d="M14 12.6c1.8.4 3.4 1.6 4.4 3.4"
        stroke="#9aa1ab"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M18.8 11.8c1.8.5 3.2 1.8 4 3.6"
        stroke="#9aa1ab"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
