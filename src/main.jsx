import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { UIProvider } from "./context/UIContext"; // <-- Import UIProvider
import "./index.css"; // Tailwind CSS import
import { ErrorBoundary } from "./components/ErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <UIProvider> {/* Wrap everything in UIProvider */}
        <AuthProvider>
          <ChatProvider>
            <ErrorBoundary>
              <App />
            </ErrorBoundary>
          </ChatProvider>
        </AuthProvider>
      </UIProvider>
    </BrowserRouter>
  </React.StrictMode>
);