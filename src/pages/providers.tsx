"use client";

import { ThemeProvider } from "@/components/ui/theme";
import { BrowserRouter } from "react-router-dom";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <BrowserRouter>
            <ThemeProvider>{children}</ThemeProvider>
        </BrowserRouter>
    );
}
