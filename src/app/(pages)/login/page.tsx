import GlobalConstants from "../../GlobalConstants";
import ProtectedPage from "../../ProtectedPage";
import LoginDashboard from "./LoginDashboard";

const LoginPage = async () => {
    return (
        <ProtectedPage name={GlobalConstants.LOGIN}>
            <LoginDashboard />
        </ProtectedPage>
    );
};

export default LoginPage;
