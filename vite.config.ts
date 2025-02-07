import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import autoprefixer from "autoprefixer";
import path from "path";
import { builtinModules } from "module";

// https://vitejs.dev/config/
export default defineConfig({
    css: {
        postcss: {
            plugins: [autoprefixer()],
        },
    },
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
