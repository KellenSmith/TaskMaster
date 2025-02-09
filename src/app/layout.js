import ContextProviders from "./context";

export const metadata = {
  title: "TaskMaster",
  description: "Your volunteer task management tool",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#121212" }}>
        <ContextProviders>{children}</ContextProviders>
      </body>
    </html>
  );
}
