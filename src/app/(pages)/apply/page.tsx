"use client";
import { Prisma } from "@prisma/client";
import GlobalConstants from "../../GlobalConstants";
import { createUser } from "../../lib/user-actions";
import { FieldLabels } from "../../ui/form/FieldCfg";
import Form from "../../ui/form/Form";
import { UserCreateSchema } from "../../lib/zod-schemas";

const ApplyPage = () => {
    const submitApplication = async (fieldValues: Prisma.UserCreateInput) => {
        try {
            await createUser(fieldValues);
            return "Application submitted successfully";
        } catch {
            throw new Error("Failed to submit application");
        }
    };

    return (
        <Form
            name={GlobalConstants.APPLY}
            buttonLabel={FieldLabels[GlobalConstants.APPLY]}
            action={submitApplication}
            validationSchema={UserCreateSchema}
            readOnly={false}
            editable={false}
        />
    );
};

export default ApplyPage;
