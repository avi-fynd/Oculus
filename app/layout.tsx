import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oculus — AI-Powered UX Audit",
  description:
    "Upload a screenshot or paste a URL. Get an instant UX audit with actionable fixes powered by AI and industry-standard design principles.",
  keywords: [
    "UX audit",
    "accessibility",
    "WCAG",
    "design review",
    "user experience",
    "AI analysis",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main-content" className="sr-only" style={{ position: 'absolute', zIndex: 1000 }}>
          Skip to main content
        </a>
        <main id="main-content" role="main">
          {children}
        </main>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)',
              color: 'var(--text-primary)',
            },
          }}
        />
      </body>
    </html>
  );
}
