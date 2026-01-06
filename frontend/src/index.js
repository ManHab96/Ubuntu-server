import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";


// 🔥 RESET FRONTEND STORAGE POR VERSION
const APP_VERSION = "3"; // ⬅️ cambia este número si algo se rompe

const storedVersion = localStorage.getItem("app_version");

if (storedVersion !== APP_VERSION) {
  console.warn("Resetting frontend storage");
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem("app_version", APP_VERSION);
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
