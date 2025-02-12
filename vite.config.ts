import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindCss from "@tailwindcss/vite";
import autoprefixer from "autoprefixer";
import Inspect from "vite-plugin-inspect";

// https://vite.dev/config/
export default defineConfig({
    css: {
        postcss: {
            plugins: [autoprefixer()],
        },
    },

    plugins: [
        react(),
        tailwindCss(),
        Inspect(),
       
       
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        rollupOptions: {
           /*  external: ["react", "react-dom", "react-router"],
            output: {
                format: "cjs",
                globals: {
                    react: "React",
                    "react-dom": "ReactDOM",
                    "react-router": "ReactRouter",
                },
            }, */
        },
    },
});
