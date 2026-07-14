import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { ThemeProvider } from "@/components/ui/theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createHashRouter, RouterProvider } from "react-router";
import Page from "./pages/app";
import SquarePage from "./pages/square/page";
import CharacterEditPage from "./pages/character/page";
import PresetViewPage from "./pages/square/[id]/page";
import NotFoundPage from "./pages/not-found";
import { MainLayout } from "./components/main-layout";



const router = createHashRouter([
    {
        path: "/",
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <Page />,
            },
            {
                path: "square",
                element: <SquarePage />,
            },
            {
                path: "square/:id",
                element: <PresetViewPage />,
            },
            {
                path: "character/:id/:mode?/:tab?",
                element: <CharacterEditPage />,
            },
            {
                path: "*",
                element: <NotFoundPage />,
            },
        ],
    },
]);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <TooltipProvider>
                <RouterProvider router={router}></RouterProvider>
            </TooltipProvider>
        </ThemeProvider>
    </StrictMode>
);
