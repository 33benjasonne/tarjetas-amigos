"use client";

import { Inter } from "next/font/google";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const navItems = [
  { href: "/", label: "Home", icon: "\uD83C\uDFE0" },
  { href: "/juntada/nueva", label: "Nueva Juntada", icon: "\u2795" },
  { href: "/leaderboard", label: "Leaderboard", icon: "\uD83C\uDFC6" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <html lang="es">
      <head>
        <title>El Tarjetero Muchachero</title>
        <meta name="description" content="El Tarjetero Muchachero - Sistema de tarjetas entre los muchachos" />
      </head>
      <body
        className={`${inter.className} antialiased bg-pitch text-foreground min-h-screen`}
      >
        {/* Main content area */}
        <main className="max-w-md mx-auto px-4 pt-4 pb-24">
          {children}
        </main>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-pitch-light/95 backdrop-blur-md border-t border-pitch-lighter">
          <div className="max-w-md mx-auto flex justify-around items-center h-16">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "text-card-yellow scale-110"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </body>
    </html>
  );
}
