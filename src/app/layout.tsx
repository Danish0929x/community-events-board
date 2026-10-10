import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth-provider";
import { SiteHeader, SiteHeaderFallback } from "@/components/site-header";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Community Events Board", template: "%s · Community Events Board" },
  description: "Discover music nights, workshops, food fairs and more happening near you.",
};

export const viewport: Viewport = { themeColor: "#e04f22" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <AuthProvider>
          <Suspense fallback={<SiteHeaderFallback />}>
            <SiteHeader />
          </Suspense>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">{children}</main>
          <footer className="border-t border-line py-6 text-center text-xs text-muted">
            Community Events Board · Made for local organisers and visitors
          </footer>
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
