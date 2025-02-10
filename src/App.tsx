import { useState } from "react";
import RootLayout from "./pages/layout";

function App() {
    const [count, setCount] = useState(0);

    return (
        <>
            <RootLayout />
        </>
    );
}

export default App;
