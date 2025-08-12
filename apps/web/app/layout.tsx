import "./globals.css";
import { ReactNode } from "react";
import { Sidebar } from "../components/Sidebar";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: "flex", minHeight: "100vh" }}>
          <Sidebar />
          <main style={{ flex: 1, padding: "16px" }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
