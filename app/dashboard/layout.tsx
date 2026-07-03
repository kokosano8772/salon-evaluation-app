import DashboardNav, { DashboardMobileNav } from "@/components/dashboard/DashboardNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF8F3] flex">
      <DashboardNav />
      <div className="flex-1 min-w-0">
        <DashboardMobileNav />
        <main className="max-w-7xl mx-auto px-5 md:pl-10 md:pr-28 py-8">{children}</main>
      </div>
    </div>
  );
}
