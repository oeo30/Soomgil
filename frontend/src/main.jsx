// src/main.jsx
import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { SelectionProvider } from "./context/SelectionContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SelectionProvider>
          <App />
        </SelectionProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);



