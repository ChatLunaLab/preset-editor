import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { ThemeProvider } from "@/components/ui/theme";
import { createHashRouter, RouterProvider } from "react-router-dom";

const CharacterEditPage = lazy(() => import("./pages/character/page.tsx"));
const SquarePage = lazy(() => import("./pages/square/page.tsx"));
const Page = lazy(() => import("./pages/app.tsx"));

const router = createHashRouter([
    {
        path: "/",
        element: (
            <Suspense fallback={<div>Loading...</div>}>
                <Page />
            </Suspense>
        ),
    },
    {
        path: "/square",
        element: (
            <Suspense fallback={<div>Loading...</div>}>
                <SquarePage />
            </Suspense>
        ),
    },
    {
        path: "/character/:id",
        element: (
            <Suspense fallback={<div>Loading...</div>}>
                <CharacterEditPage />
            </Suspense>
        ),
    },
]);

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <ThemeProvider>
            <RouterProvider router={router}></RouterProvider>
        </ThemeProvider>
    </StrictMode>
);
