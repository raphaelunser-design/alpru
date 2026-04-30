type SectionProps = {
  children: React.ReactNode;
  className: string;
};

export default function Section({ children, className }: SectionProps) {
  return <section className={`mx-auto w-full max-w-6xl px-4 py-10 md:px-6 ${className ?? ""}`}>{children}</section>;
}
