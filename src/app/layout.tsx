import type { Metadata } from "next";
import "./globals.css";
import ThemeWrapper from "@/components/ThemeWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Community Care",
  description: "Connecting communities through care and support",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <ErrorBoundary>
          <ThemeWrapper>{children}</ThemeWrapper>
        </ErrorBoundary>
      </body>
    </html>
  );
}
