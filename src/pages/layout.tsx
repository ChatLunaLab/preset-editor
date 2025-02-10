"use client";

import { Providers } from "./providers";
import "@/styles/globals.css";
import {  Routes, Route } from "react-router-dom";
import Page from "./page";
import CharacterEditPage from "./character/page";
import SquarePage from "./square/page";

export default function RootLayout() {
    return (
        <Providers>
            <Routes>
                <Route path="/" element={<Page />} />
                <Route path="character" element={<CharacterEditPage />} />
                <Route path="square" element={<SquarePage />} />
            </Routes>
        </Providers>
    );
}
