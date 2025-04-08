import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UpMath",
  description: "UpMath is a platform for teachers to create and manage math exercises.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
