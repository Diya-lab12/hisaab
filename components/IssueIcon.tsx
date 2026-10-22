const PATHS: Record<string, React.ReactNode> = {
  refund: <path d="M4 12a8 8 0 1 0 2.4-5.7M4 5v4h4" strokeLinecap="round" strokeLinejoin="round" />,
  delivery: <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19.5a1.5 1.5 0 1 0 0-.01M17 19.5a1.5 1.5 0 1 0 0-.01" strokeLinecap="round" strokeLinejoin="round" />,
  faulty: <path d="M12 3l9 16H3L12 3zM12 10v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />,
  subscription: <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" strokeLinecap="round" strokeLinejoin="round" />,
  other: <path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3" strokeLinecap="round" />,
};

export default function IssueIcon({ id, size = 26 }: { id: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      {PATHS[id] ?? PATHS.other}
    </svg>
  );
}
