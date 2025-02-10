"use client";

import "@/styles/globals.css";
import Page from "./page";
import CharacterEditPage from "./character/page";
import SquarePage from "./square/page";
import { ThemeProvider } from "@/components/ui/theme";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Page />,
    },
    { path: "/character", element: <CharacterEditPage /> },
    { path: "/square", element: <SquarePage /> },
]);

export default function RootLayout() {
    return (
        <ThemeProvider>
            <RouterProvider router={router}></RouterProvider>
        </ThemeProvider>
    );
}
