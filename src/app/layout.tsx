import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quiz Claude Code",
  description:
    "Teste seus conhecimentos sobre o Claude Code em 15 perguntas de Verdadeiro ou Falso.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-border px-4 py-4 text-center font-mono text-xs text-muted">
          Projeto não oficial. Claude Code é um produto da Anthropic.
        </footer>
      </body>
    </html>
  );
}
