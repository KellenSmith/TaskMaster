import HomeDashboard from "./HomeDashboard";
import { getCachedTextContent } from "./lib/text-content-actions";
import ProtectedPage from "./ProtectedPage";
import GlobalConstants from "./GlobalConstants";
import { FC } from "react";

const HomePage: FC = async () => {
    const textContentPromise = getCachedTextContent("home");

    return (
        <ProtectedPage name={GlobalConstants.HOME}>
            <HomeDashboard textContentPromise={textContentPromise} />
        </ProtectedPage>
    );
};

export default HomePage;
