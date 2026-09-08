// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";
import HydrationFix from "./hydration-fix";
import { TimerProvider } from "@/contexts/TimerContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

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
          <SocketProvider>
            <NotificationProvider>
              <TimerProvider>{children}</TimerProvider>
            </NotificationProvider>
          </SocketProvider>
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}