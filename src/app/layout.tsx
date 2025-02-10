import React from "react";
import ContextProviders from "./context";

export const metadata = {
  title: "TaskMaster",
  description: "Your volunteer task management tool",
};

interface RootLayoutProps {
  children: React.ReactNode
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#121212" }}>
        <ContextProviders>{children}</ContextProviders>
      </body>
    </html>
  );
}

export default RootLayout;
