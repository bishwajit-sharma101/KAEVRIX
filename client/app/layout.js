import "./index.css";

export const metadata = {
  title: "Kaevrix",
  description: "Multiplayer Video Matchmaking & Quiz Duel",
  icons: {
    icon: "/logo-black.png?v=2",
    shortcut: "/logo-black.png?v=2",
    apple: "/logo-black.png?v=2",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            // Remove simulator pre-loader elements before React hydrates to prevent crashes
            const clean = () => {
              const el = document.querySelector('.simulator-pre-loader');
              if (el) {
                el.remove();
              }
            };
            clean();
            document.addEventListener('DOMContentLoaded', clean);
            window.addEventListener('load', clean);
          })();
        ` }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
