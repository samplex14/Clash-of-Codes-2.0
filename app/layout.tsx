import type { Metadata } from "next";
import "@/app/globals.css";
import AppProviders from "@/components/providers/AppProviders";

export const metadata: Metadata = {
  title: "Clash of Codes 2.0",
  description: "Prepare for Battle. Code to Survive."
};

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps): JSX.Element => {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <div className="min-h-screen pt-4 pb-12 px-4 sm:px-6 lg:px-8">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
};

export default RootLayout;
