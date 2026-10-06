import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barbearia Nilles | Cortes e finalizações",
  description: "Cortes precisos, barba alinhada e finalizações na Barbearia Nilles.",
  icons: {
    icon: "/logo-bn-gold.png",
    shortcut: "/logo-bn-gold.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
