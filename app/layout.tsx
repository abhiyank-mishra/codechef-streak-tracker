import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CodeChef Streak & Contest Tracker | Vercel Ready",
  description: "Check any CodeChef user's contest streak, rating history, and participation stats instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
