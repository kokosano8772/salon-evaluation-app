export default function DiagnosisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen max-w-[480px] mx-auto bg-[#FAF8F3] relative shadow-[0_0_60px_rgba(0,0,0,0.12)]">
      {children}
    </div>
  );
}
