import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// Force bright default theme (daisyUI theme name 'modern')
if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-theme", "modern");
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
