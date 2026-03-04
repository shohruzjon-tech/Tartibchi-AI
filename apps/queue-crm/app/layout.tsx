import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Queue System - Smart Queue Management",
  description: "Multi-tenant SaaS queue management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
