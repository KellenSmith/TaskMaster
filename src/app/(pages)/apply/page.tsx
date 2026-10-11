import GlobalConstants from "../../GlobalConstants";
import ProtectedPage from "../../ProtectedPage";
import ApplyDashboard from "./ApplyDashboard";
import { getCachedTextContent } from "../../lib/text-content-actions";

const ApplyPage = async () => {
    const textContentPromise = getCachedTextContent(GlobalConstants.APPLY);
    return (
        <ProtectedPage name={GlobalConstants.APPLY}>
            <ApplyDashboard textContentPromise={textContentPromise} />
        </ProtectedPage>
    );
};

export default ApplyPage;
