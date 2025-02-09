import ContextProviders from "./context";

export const metadata = {
  title: "TaskMaster",
  description: "Your volunteer task management tool",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ContextProviders>{children}</ContextProviders>
      </body>
    </html>
  );
}
