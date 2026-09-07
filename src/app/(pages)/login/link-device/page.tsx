import GlobalConstants from "../../../GlobalConstants";
import ProtectedPage from "../../../ProtectedPage";
import LinkDeviceDashboard from "./LinkDeviceDashboard";

const LinkDevicePage = async () => {
    return (
        <ProtectedPage name={GlobalConstants.LOGIN}>
            <LinkDeviceDashboard />
        </ProtectedPage>
    );
};

export default LinkDevicePage;
