import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "CorrigeAI - Assistente Educacional",
  description: "Assistente de IA para professores com funcionalidades de análise de PDF, criação de conteúdo e geração de imagens",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
