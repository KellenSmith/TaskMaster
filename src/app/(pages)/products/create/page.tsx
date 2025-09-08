"use client";
import GlobalConstants from "../../../GlobalConstants";
import { createProduct } from "../../../lib/product-actions";
import Form from "../../../ui/form/Form";
import { ProductCreateSchema } from "../../../lib/zod-schemas";

const CreateProductPage = () => {
    const createProductAction = async (formData: FormData) => {
        await createProduct(formData);
        return "Created product";
    };
    return (
        <Form
            name={GlobalConstants.PRODUCT}
            buttonLabel="create"
            action={createProductAction}
            validationSchema={ProductCreateSchema}
            readOnly={false}
            editable={false}
        />
    );
};

export default CreateProductPage;
