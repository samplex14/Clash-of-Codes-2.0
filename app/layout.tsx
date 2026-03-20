import "@/app/globals.css";
import type { Metadata } from "next";
import { Poppins as FontSans, Cinzel_Decorative, Cinzel } from "next/font/google"; // Import Google Fonts
import { cn } from "@/lib/utils"; // If a cn helper exists, or just use className
import AppProviders from "@/components/providers/AppProviders";
import { Analytics } from "@vercel/analytics/react";
import TeamSarkBadge from "@/components/TeamSarkBadge";
import TeamSarkLogo from "@/components/TeamSarkLogo";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const fontCinzelDecorative = Cinzel_Decorative({
  subsets: ["latin"],
  variable: "--font-cinzel-decorative",
  weight: ["400", "700", "900"],
});

const fontCinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Clash of Codes 2.0",
  description: "Prepare for Battle. Code to Survive.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fontSans.variable} ${fontCinzelDecorative.variable} ${fontCinzel.variable} font-clash antialiased`}
      >
        <AppProviders>{children}</AppProviders>
         <Analytics />
         <TeamSarkBadge />
         <TeamSarkLogo />
      </body>
    </html>
  );
}

