import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { ThemeProvider } from "@/components/ui/theme";
import { createHashRouter, RouterProvider } from "react-router-dom";
import Page from "./pages/app";
import SquarePage from "./pages/square/page";
import CharacterEditPage from "./pages/character/page";



const router = createHashRouter([
    {
        path: "/",
        element: <Page />,
    },
    {
        path: "/square",
        element: <SquarePage />,
    },
    {
        path: "/character/:id",
        element: <CharacterEditPage />,
    },
]);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <RouterProvider router={router}></RouterProvider>
        </ThemeProvider>
    </StrictMode>
);
