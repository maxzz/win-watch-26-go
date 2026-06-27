import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    base: "",
    resolve: {
        alias: {
            "@renderer": resolve(__dirname, "src"),
        },
    },
    plugins: [
        react(),
        tailwindcss(),
    ],
    server: {
        port: 5173,
        strictPort: true,
    },
});
