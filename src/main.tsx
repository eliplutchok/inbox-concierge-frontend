import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { EmailProvider } from "./context/EmailContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <EmailProvider>
        <App />
      </EmailProvider>
    </AuthProvider>
  </StrictMode>
);
