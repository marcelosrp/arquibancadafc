import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Arquibancada",
  description: "Dashboard do seu clube favorito: competições, classificação, artilheiros e próxima partida.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${barlow.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        {/* Temporário (Task 3 move para (auth)/layout.tsx) */}
        <div className="fixed top-3 right-3 z-50">
          <ThemeToggle />
        </div>
        {children}
      </body>
    </html>
  );
}
