import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";

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
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <a href="/" className="text-lg font-bold text-blue-600">
              Uni Match SG
            </a>
            <nav className="hidden items-center gap-6 text-sm sm:flex">
              <a
                href="/results-input"
                className="text-gray-600 transition-colors hover:text-blue-600"
              >
                Enter Results
              </a>
              <a
                href="/quiz"
                className="text-gray-600 transition-colors hover:text-blue-600"
              >
                Interests Quiz
              </a>
              <a
                href="/recommendations"
                className="text-gray-600 transition-colors hover:text-blue-600"
              >
                Recommendations
              </a>
            </nav>
          </div>
        </header>
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
