import GlobalConstants from "../../../GlobalConstants";
import ProtectedPage from "../../../ProtectedPage";

const CreateProductPage = async () => {
    return (
        <ProtectedPage name={GlobalConstants.PRODUCTS}>
            <CreateProductPage />
        </ProtectedPage>
    );
};

export default CreateProductPage;
