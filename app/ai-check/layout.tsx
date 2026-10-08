// 既存の美容室価値診断（app/(diagnosis)/layout.tsx）と同じく、PC幅でも
// スマホサイズのまま中央表示する（この手の診断ツールはスマホでの利用が前提のため）。
export default function AiCheckLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen max-w-[480px] mx-auto bg-[#FAF8F3] relative shadow-[0_0_60px_rgba(0,0,0,0.12)]">
      {children}
    </div>
  );
}
