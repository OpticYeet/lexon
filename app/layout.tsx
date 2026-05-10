import type { Metadata } from "next";
import { Lora, DM_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lexon — Stay curious. Stay sharp.",
  description:
    "Discover scientific research papers daily. Build a reading streak and expand your knowledge across biology, physics, CS, economics, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${lora.variable} ${dmSans.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-paper text-ink font-sans">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
