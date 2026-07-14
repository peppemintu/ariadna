import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";

// Fonts (Ariadna type stack) — pulled from @fontsource, not bundled woff2.
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "@fontsource/shantell-sans/400.css";
import "@fontsource/shantell-sans/600.css";

import "./styles/tokens.css";
import "./styles/global.css";

import { queryClient } from "./lib/queryClient";
import { CurrentUserProvider } from "./lib/currentUser";
import { SettingsProvider } from "./lib/settings";
import { ThemeProvider } from "./lib/theme";
import { ToastProvider } from "./ui";
import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
      <CurrentUserProvider>
        <SettingsProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </SettingsProvider>
      </CurrentUserProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
