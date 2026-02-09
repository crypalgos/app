import { ThemeProvider } from "./theme-provider";
import ReactQueryProvider from "./react-query";

export default function GlobalProviders({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ReactQueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange>
        {children}
      </ThemeProvider>
    </ReactQueryProvider>
  )
}
