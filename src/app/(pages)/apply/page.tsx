"use client";
import GlobalConstants from "../../GlobalConstants";
import { createUser } from "../../lib/user-actions";
import { FieldLabels } from "../../ui/form/FieldCfg";
import Form from "../../ui/form/Form";
import { UserCreateSchema } from "../../lib/zod-schemas";
import z from "zod";
import { navigateToRoute } from "../../ui/utils";
import { useRouter } from "next/navigation";

const ApplyPage = () => {
    const router = useRouter();

    const submitApplication = async (fieldValues: z.infer<typeof UserCreateSchema>) => {
        try {
            await createUser(fieldValues);
            // TODO: Send email notification to organization
            navigateToRoute("/login", router);
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
