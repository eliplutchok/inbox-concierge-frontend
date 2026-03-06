import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { EmailProvider } from "./context/EmailContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <EmailProvider>
      <App />
    </EmailProvider>
  </AuthProvider>
);
