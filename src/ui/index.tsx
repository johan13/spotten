import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { CssBaseline } from "@mui/material";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app";

const root = document.getElementById("root");
if (!root) throw new Error("root element not found");

createRoot(root).render(
    <React.StrictMode>
        <CssBaseline />
        <App />
    </React.StrictMode>,
);
