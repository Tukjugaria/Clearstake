interface BrandMarkProps {
  size?: number;
  className?: string;
}

/**
 * 지분노트 브랜드 마크 — 잉크 타일 + 흰 파이(지분/ownership) + 액센트 슬라이스.
 * 배경 색과 무관하게 보이도록 색을 고정한다(어느 섹션에서나 동일).
 */
export function BrandMark({ size = 28, className = '' }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="지분노트"
    >
      <rect width="32" height="32" rx="7" fill="#1f2430" />
      <circle cx="16" cy="16" r="9" fill="#ffffff" />
      <path d="M16 16 L16 7 A9 9 0 0 1 23.79 20.5 Z" fill="#5b86c9" />
    </svg>
  );
}
