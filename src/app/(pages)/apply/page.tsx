import { Prisma } from "@prisma/client";
import GlobalConstants from "../../GlobalConstants";
import { createUser } from "../../lib/user-actions";
import { FieldLabels } from "../../ui/form/FieldCfg";
import Form from "../../ui/form/Form";
import { FormActionState } from "../../lib/definitions";

const ApplyPage = () => {
    const submitApplication = async (currentActionState: FormActionState, fieldValues: any) => {
        "use server";
        const strippedFieldValues = Object.fromEntries(
            Object.entries(fieldValues).filter(
                // eslint-disable-next-line no-unused-vars
                ([fieldId, _]) => fieldId !== GlobalConstants.CONSENT_GDPR,
            ),
        ) as Prisma.UserCreateInput;
        const submitState = await createUser(currentActionState, strippedFieldValues);
        if (submitState.status === 201) submitState.result = "Application submitted";
        return submitState;
    };
    return (
        <Form
            name={GlobalConstants.APPLY}
            buttonLabel={FieldLabels[GlobalConstants.APPLY]}
            action={submitApplication}
            readOnly={false}
            editable={false}
        />
    );
};

export default ApplyPage;
