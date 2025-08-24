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
        fieldValues: z.infer<typeof OrganizationSettingsUpdateSchema>,
    ) => {
        await updateOrganizationSettings(fieldValues);
        return "Updated organization settings";
    };

    // TODO: Add explanatory texts for settings fields
    return (
        <Form
            name={GlobalConstants.ORGANIZATION_SETTINGS}
            buttonLabel="save"
            action={saveOrganizationSettings}
            validationSchema={OrganizationSettingsUpdateSchema}
            readOnly={false}
            editable={false}
            defaultValues={organizationSettings || {}}
        />
    );
};

export default OrganizationSettingsPage;
