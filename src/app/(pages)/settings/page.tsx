"use client";

import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";
import GlobalConstants from "../../GlobalConstants";
import { updateOrganizationSettings } from "../../lib/organization-settings-actions";
import Form from "../../ui/form/Form";
import z from "zod";
import { OrganizationSettingsUpdateSchema } from "../../lib/zod-schemas";

const OrganizationSettingsPage = () => {
    const { organizationSettings } = useOrganizationSettingsContext();

    const saveOrganizationSettings = async (
        parsedFieldValues: z.infer<typeof OrganizationSettingsUpdateSchema>,
    ) => {
        await updateOrganizationSettings(parsedFieldValues);
        return "Updated organization settings";
    };

    return (
        <Form
            name={GlobalConstants.ORGANIZATION_SETTINGS}
            buttonLabel="save"
            action={saveOrganizationSettings}
            validationSchema={OrganizationSettingsUpdateSchema}
            readOnly={false}
            editable={true}
            defaultValues={organizationSettings || {}}
        />
    );
};

export default OrganizationSettingsPage;
