import type { Metadata } from "next";
import "./globals.css";
import "@/showcase/index.css";
import { getImagePath } from "@/utils/imagePath";
import { TooltipProvider } from "@/showcase/components/ui/tooltip";

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
    <html lang="tr">
      <body className="antialiased">
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
