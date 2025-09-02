import React from "react";
import { Inter } from "next/font/google";
import Navbar from "../components/Navbar/index.jsx";
import Footer from "../components/Footer/index.jsx";
import AuthGuard from "../components/AuthGuard.jsx";
import { AuthProvider } from "../contexts/AuthContext.js";
import { ToastProvider } from "../components/Toast/index.jsx";
import ConditionalLayout from "../components/ConditionalLayout.jsx";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata = {
  title: "CorrigeAI - Assistente Educacional",
  description: "Assistente de IA para professores com funcionalidades de análise de PDF, criação de conteúdo e geração de imagens",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ToastProvider>
          <AuthProvider>
            <AuthGuard>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
            </AuthGuard>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
