"use client";

import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";
import GlobalConstants from "../../GlobalConstants";
import { FormActionState } from "../../lib/definitions";
import { updateOrganizationSettings } from "../../lib/organization-settings-actions";
import Form from "../../ui/form/Form";

const OrganizationSettingsPage = () => {
    const { organizationSettings, refreshOrganizationSettings } = useOrganizationSettingsContext();

    const saveOrganizationSettings = async (
        currentActionState: FormActionState,
        fieldValues: any,
    ) => {
        const saveOrganizationSettingsResult = await updateOrganizationSettings(
            currentActionState,
            fieldValues,
        );
        if (saveOrganizationSettingsResult.status === 200) {
            await refreshOrganizationSettings();
        }
        return saveOrganizationSettingsResult;
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
