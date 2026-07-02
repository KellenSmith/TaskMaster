import GlobalConstants from "../../GlobalConstants";
import ProtectedPage from "../../ProtectedPage";
import OrganizationSettingsDashboard from "./SettingsDashboard";

const SettingsPage = () => {
    return (
        <ProtectedPage name={GlobalConstants.ORGANIZATION_SETTINGS}>
            <OrganizationSettingsDashboard />
        </ProtectedPage>
    );
};

export default SettingsPage;
