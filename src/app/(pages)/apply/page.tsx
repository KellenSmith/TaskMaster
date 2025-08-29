"use client";
import GlobalConstants from "../../GlobalConstants";
import { submitMemberApplication } from "../../lib/user-actions";
import { FieldLabels } from "../../ui/form/FieldCfg";
import Form from "../../ui/form/Form";
import { MembershipApplicationSchema } from "../../lib/zod-schemas";
import z from "zod";
import { useRouter } from "next/navigation";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";
import { useMemo } from "react";
import { Stack } from "@mui/material";
import { clientRedirect } from "../../lib/definitions";
import LanguageTranslations from "./LanguageTranslations";
import { useUserContext } from "../../context/UserContext";

const ApplyPage = () => {
    const router = useRouter();
    const { language } = useUserContext();
    const { organizationSettings } = useOrganizationSettingsContext();
    const shouldIncludeApplicationPrompt = useMemo(
        (): boolean => !!organizationSettings.member_application_prompt,
        [organizationSettings],
    );

    const submitApplication = async (
        parsedFieldValues: z.infer<typeof MembershipApplicationSchema>,
    ) => {
        try {
            await submitMemberApplication(parsedFieldValues);
            clientRedirect(router, [GlobalConstants.LOGIN]);
            return "Application submitted successfully";
        } catch {
            throw new Error("Failed to submit application");
        }
    };

    return (
        <Stack spacing={1}>
            <Form
                name={GlobalConstants.APPLY}
                buttonLabel={LanguageTranslations[GlobalConstants.APPLY][language]}
                action={submitApplication}
                validationSchema={MembershipApplicationSchema}
                customIncludedFields={
                    shouldIncludeApplicationPrompt
                        ? [GlobalConstants.MEMBER_APPLICATION_PROMPT]
                        : []
                }
                customRequiredFields={
                    shouldIncludeApplicationPrompt
                        ? [GlobalConstants.MEMBER_APPLICATION_PROMPT]
                        : []
                }
                customInfoTexts={
                    shouldIncludeApplicationPrompt
                        ? {
                              [GlobalConstants.MEMBER_APPLICATION_PROMPT]:
                                  organizationSettings.member_application_prompt,
                          }
                        : {}
                }
                readOnly={false}
                editable={false}
            />
        </Stack>
    );
};

export default ApplyPage;
