// Temporarily disable Google Fonts to fix Turbopack issue
// import { Geist } from "next/font/google";
import "../globals.css";

// Use system fonts as fallback
const geist = { className: "font-sans" };

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-slate-950`}>
        <main className="flex min-h-screen flex-col items-center justify-center p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
