import React from "react";
import HomeDashboard from "./HomeDashboard";
import { getCachedTextContent } from "./lib/text-content-actions";

const HomePage: React.FC = async () => {
    const textContentPromise = getCachedTextContent("home");

    return <HomeDashboard textContentPromise={textContentPromise} />;
};

export default HomePage;
