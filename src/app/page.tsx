import React from "react";
import GlobalConstants from "./GlobalConstants";
import ErrorBoundarySuspense from "./ui/ErrorBoundarySuspense";
import HomeDashboard from "./HomeDashboard";
import { unstable_cache } from "next/cache";
import { getTextContent } from "./lib/text-content-actions";

const HomePage: React.FC = async () => {
    const textContentPromise = unstable_cache(getTextContent, ["home"], {
        tags: [GlobalConstants.TEXT_CONTENT],
    })("home");

    return (
        <ErrorBoundarySuspense>
            <HomeDashboard textContentPromise={textContentPromise} />
        </ErrorBoundarySuspense>
    );
};

export default HomePage;
