"use client";

import { OrganizationSettings, Prisma } from "@prisma/client";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";
import GlobalConstants from "../../GlobalConstants";
import { FormActionState } from "../../lib/definitions";
import { updateOrganizationSettings } from "../../lib/organization-settings-actions";
import Form from "../../ui/form/Form";

const OrganizationSettingsPage = () => {
    const { organizationSettings } = useOrganizationSettingsContext();

    const saveOrganizationSettings = async (fieldValues: OrganizationSettings) => {
        await updateOrganizationSettings(fieldValues);
        return "Updated organization settings";
    };

    return (
        <Form
            name={GlobalConstants.ORGANIZATION_SETTINGS}
            buttonLabel="save"
            action={saveOrganizationSettings}
            readOnly={false}
            editable={false}
            defaultValues={organizationSettings || {}}
        />
    );
};

export default OrganizationSettingsPage;
