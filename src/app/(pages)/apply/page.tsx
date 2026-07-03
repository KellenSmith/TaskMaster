import GlobalConstants from "../../GlobalConstants";
import ProtectedPage from "../../ProtectedPage";
import ApplyDashboard from "./ApplyDashboard";

const ApplyPage = async () => {
    return (
        <ProtectedPage name={GlobalConstants.APPLY}>
            <ApplyDashboard />
        </ProtectedPage>
    );
};

export default ApplyPage;
