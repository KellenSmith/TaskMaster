import GlobalConstants from "../../../GlobalConstants";
import { createProduct } from "../../../lib/product-actions";
import Form from "../../../ui/form/Form";

const CreateProductPage = () => {
    return (
        <Form
            name={GlobalConstants.PRODUCT}
            buttonLabel="create"
            action={createProduct}
            readOnly={false}
            editable={false}
        />
    );
};

export default CreateProductPage;
