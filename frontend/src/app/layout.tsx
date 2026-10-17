import type { Metadata } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
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
  title: "AML Detection Platform",
  description:
    "Explainable graph-enhanced ML platform for AML alert triage and investigation.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <Script
          id="theme-initializer"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('aml-theme-preference');
                  var theme = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
        <Script
          id="firefox-perf-fix"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof window !== 'undefined' && window.performance && window.performance.measure) {
                  var origMeasure = window.performance.measure.bind(window.performance);
                  window.performance.measure = function(name, startOrOptions, end) {
                    try {
                      if (typeof startOrOptions === 'object' && startOrOptions !== null) {
                        var s = startOrOptions.start;
                        var e = startOrOptions.end;
                        if ((typeof s === 'number' && s < 0) || (typeof e === 'number' && e < 0)) {
                          return;
                        }
                      }
                      return origMeasure(name, startOrOptions, end);
                    } catch (err) {
                      return;
                    }
                  };
                }
              })();
            `,
          }}
        />
        <link
          rel="preload"
          href="/fonts/material-symbols-outlined.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
