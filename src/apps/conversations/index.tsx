import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

import LoggerProvider from "@/services/logger/LoggerProvider";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Root element not found");
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <LoggerProvider>
      <App />
    </LoggerProvider>
  </StrictMode>,
);
