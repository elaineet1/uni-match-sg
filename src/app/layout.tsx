import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { NavHeader } from "@/components/nav-header";
import { ResetFromQuery } from "@/components/reset-from-query";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Uni Match SG - University Course Finder for Singapore A Level Students",
  description:
    "Calculate your UAS (University Admission Score) and explore matching courses at NUS, NTU, and SMU based on your A Level results and interests.",
  keywords: [
    "Singapore",
    "university",
    "A Level",
    "UAS",
    "RP",
    "NUS",
    "NTU",
    "SMU",
    "course finder",
    "IGP",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen`}>
        <ResetFromQuery />
        <NavHeader />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
          <div className="mx-auto max-w-5xl px-4">
            <p>
              Uni Match SG is an unofficial tool. Please refer to official
              university websites for the most accurate and up-to-date
              information.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
