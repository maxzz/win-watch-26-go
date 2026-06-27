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
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes("node_modules")) {
                        return;
                    }
                    if (id.includes("react-dom") || id.includes("/react/")) {
                        return "react";
                    }
                    if (id.includes("@radix-ui")) {
                        return "radix";
                    }
                    if (id.includes("motion") || id.includes("framer-motion")) {
                        return "motion";
                    }
                    if (id.includes("lucide-react")) {
                        return "lucide";
                    }
                    return "vendor";
                },
            },
        },
    },
});
