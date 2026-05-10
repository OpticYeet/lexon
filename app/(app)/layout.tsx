import { AppNav } from "@/components/layout/AppNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppNav />
      <main className="md:ml-16 pb-20 md:pb-8">
        <div className="max-w-2xl mx-auto px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
