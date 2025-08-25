"use client";
import z from "zod";
import GlobalConstants from "../../../GlobalConstants";
import { createUser } from "../../../lib/user-actions";
import Form from "../../../ui/form/Form";
import { UserCreateSchema } from "../../../lib/zod-schemas";

const CreateUserPage = () => {
    const createAction = async (fieldValues: z.infer<typeof UserCreateSchema>) => {
        await createUser(fieldValues);
        return "Created user";
    };

    return (
        <Form
            name={GlobalConstants.USER}
            buttonLabel="create"
            action={createAction}
            validationSchema={UserCreateSchema}
            readOnly={false}
            editable={false}
        />
    );
};

export default CreateUserPage;
