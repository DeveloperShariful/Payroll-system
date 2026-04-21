// frontend/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Enterprise Payroll Portal",
  description: "Web frontend for specialized labor source payroll system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> 
      <body 
        className={inter.className} 
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}