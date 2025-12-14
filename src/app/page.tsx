import React from "react";
import ErrorBoundarySuspense from "./ui/ErrorBoundarySuspense";
import HomeDashboard from "./HomeDashboard";
import { getTextContent } from "./lib/text-content-actions";

const HomePage: React.FC = async () => {
    const textContentPromise = getTextContent("home")

    return (
        <ErrorBoundarySuspense>
            <HomeDashboard textContentPromise={textContentPromise} />
        </ErrorBoundarySuspense>
    );
};

export default HomePage;
