import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AttendX — Smart Attendance System",
  description:
    "Present Today, Prepared Tomorrow. Intelligent university timetable and QR attendance management system.",
  icons: {
    icon: [
      { url: "/brand/attendx-favicon.svg", type: "image/svg+xml" },
      { url: "/brand/attendx-mark.svg", type: "image/svg+xml" },
    ],
    shortcut: "/brand/attendx-favicon.svg",
    apple: "/brand/attendx-icon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
