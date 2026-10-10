import GlobalConstants from "../../../GlobalConstants";
import ProtectedPage from "../../../ProtectedPage";
import ManualCodeEntryDashboard from "./ManualCodeEntryDashboard";

const ApprovePage = async () => {
    return (
        <ProtectedPage name={GlobalConstants.LOGIN}>
            <ManualCodeEntryDashboard />
        </ProtectedPage>
    );
};

export default ApprovePage;
