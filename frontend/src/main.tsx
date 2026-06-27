import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./components/0-all-layout/0-app";
import { installTmApi } from "./api/tmApi";
import './assets/index.css';

installTmApi();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
