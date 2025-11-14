import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getImagePath } from "@/utils/imagePath";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export async function generateMetadata(): Promise<Metadata> {
  const faviconPath = getImagePath("/assets/icons/game-logo.png");
  
  return {
    title: "Andron",
    description: "Andron - Your Digital Assessment Platform",
    icons: {
      icon: [
        {
          url: faviconPath,
          type: "image/png",
        },
      ],
      shortcut: faviconPath,
      apple: faviconPath,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased font-sans`}
      >
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
