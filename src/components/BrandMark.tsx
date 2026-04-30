export function BrandMark({ size = 48 }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 60c10-14 18-25 18-36a18 18 0 10-36 0c0 11 8 22 18 36z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M22 28l10-10 10 10" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="M24 40c10-4 16-10 22-18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="24" r="2.5" fill="currentColor" />
    </svg>
  );
}
