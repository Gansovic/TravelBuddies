import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "./providers";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <main style={{ minHeight: "100vh", padding: "16px" }}>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
