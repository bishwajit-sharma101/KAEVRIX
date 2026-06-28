import "./index.css";

export const metadata = {
  title: "Kaevrix",
  description: "Multiplayer Video Matchmaking & Quiz Duel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  );
}
