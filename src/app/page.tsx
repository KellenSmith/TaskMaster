import React from "react";
// ...existing code...
import HomeDashboard from "./HomeDashboard";
import { getTextContent } from "./lib/text-content-actions";

export const dynamic = "force-dynamic";

const HomePage: React.FC = async () => {
    const textContentPromise = getTextContent("home");

    return <HomeDashboard textContentPromise={textContentPromise} />;
};

export default HomePage;
