import GlobalConstants from "../GlobalConstants";
import { createUser } from "../lib/actions";
import { FieldLabels } from "../ui/form/FieldCfg";
import Form, { FormActionState } from "../ui/form/Form";

const ApplyPage = () => {
    const submitApplication = async (currentActionState: FormActionState, formData: FormData) => {
        "use server";
        const submitState = await createUser(currentActionState, formData);
        if (submitState.status === 201) submitState.result = "Application submitted";
        return submitState;
    };
    return (
        <Form
            name={GlobalConstants.APPLY}
            buttonLabel={FieldLabels[GlobalConstants.APPLY]}
            action={submitApplication}
        />
    );
};

export default ApplyPage;
