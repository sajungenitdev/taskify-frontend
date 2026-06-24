import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import HydrationFix from "./hydration-fix";
import { TimerProvider } from "@/contexts/TimerContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Task Management System",
  description: "Enterprise Task Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <HydrationFix />
        <AuthProvider>
          <TimerProvider>{children}</TimerProvider>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
