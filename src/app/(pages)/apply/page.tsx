"use client";
import GlobalConstants from "../../GlobalConstants";
import { submitMemberApplication } from "../../lib/user-actions";
import { FieldLabels } from "../../ui/form/FieldCfg";
import Form from "../../ui/form/Form";
import { MembershipApplicationSchema } from "../../lib/zod-schemas";
import z from "zod";
import { navigateToRoute } from "../../ui/utils";
import { useRouter } from "next/navigation";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";
import { useMemo } from "react";
import { Card, Stack, Typography } from "@mui/material";

const ApplyPage = () => {
    const router = useRouter();
    const { organizationSettings } = useOrganizationSettingsContext();
    const shouldIncludeApplicationPrompt = useMemo(
        (): boolean => !!organizationSettings.memberApplicationPrompt,
        [organizationSettings],
    );

    const submitApplication = async (
        parsedFieldValues: z.infer<typeof MembershipApplicationSchema>,
    ) => {
        try {
            await submitMemberApplication(parsedFieldValues);
            navigateToRoute(router, [GlobalConstants.LOGIN]);
            return "Application submitted successfully";
        } catch {
            throw new Error("Failed to submit application");
        }
    };

    return (
        <Stack spacing={1}>
            {shouldIncludeApplicationPrompt && (
                <Card>
                    {organizationSettings.memberApplicationPrompt.split("\n").map((line, index) => (
                        <Typography key={index} variant="h6" color="primary">
                            {line}
                        </Typography>
                    ))}
                </Card>
            )}
            <Form
                name={GlobalConstants.APPLY}
                buttonLabel={FieldLabels[GlobalConstants.APPLY]}
                action={submitApplication}
                validationSchema={MembershipApplicationSchema}
                customIncludedFields={
                    shouldIncludeApplicationPrompt
                        ? [GlobalConstants.MEMBER_APPLICATION_PROMPT]
                        : []
                }
                customRequiredFields={[GlobalConstants.MEMBER_APPLICATION_PROMPT]}
                readOnly={false}
                editable={false}
            />
        </Stack>
    );
};

export default ApplyPage;
