import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TweetToCourse - Turn your threads into sellable courses in seconds",
  description: "Transform Twitter threads and tweets into structured mini-courses with AI. Perfect for content creators, coaches, and solopreneurs.",
  keywords: ["twitter", "course creation", "AI", "content creation", "education"],
  authors: [{ name: "TweetToCourse" }],
  openGraph: {
    title: "TweetToCourse - AI Course Alchemist",
    description: "Turn your threads into sellable courses in seconds",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
