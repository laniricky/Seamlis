import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Seamlis — Watch, Create, Share",
    template: "%s | Seamlis",
  },
  description:
    "Seamlis is a modern, creator-first video sharing platform. Discover trending videos, follow your favorite creators, and share your story with the world.",
  keywords: ["video", "streaming", "creator", "seamlis", "watch", "share"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://seamlis.com",
    siteName: "Seamlis",
    title: "Seamlis — Watch, Create, Share",
    description:
      "Seamlis is a modern, creator-first video sharing platform.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seamlis — Watch, Create, Share",
    description: "Seamlis is a modern, creator-first video sharing platform.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { AuthProvider } from "@/components/providers/AuthProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
