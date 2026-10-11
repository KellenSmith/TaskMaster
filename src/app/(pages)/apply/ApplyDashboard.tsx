"use client";
import GlobalConstants from "../../GlobalConstants";
import { submitMemberApplication } from "../../lib/user-actions";
import Form from "../../ui/form/Form";
import { MembershipApplicationSchema } from "../../lib/zod-schemas";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";
import { useState } from "react";
import {
    Alert,
    AlertTitle,
    Checkbox,
    FormControlLabel,
    Link,
    Stack,
    Typography,
} from "@mui/material";
import LanguageTranslations from "./LanguageTranslations";
import OrderLanguageTranslations from "../order/LanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import { getPrivacyPolicyUrl, getTermsOfMembershipUrl } from "../../ui/utils";
import { Prisma } from "../../../prisma/generated/browser";
import TextContent from "../../ui/TextContent";
import MembershipStepper from "../../ui/MembershipStepper";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";

interface ApplyDashboardProps {
    /** Organization-authored "what happens next" text, edited in website edit mode. */
    textContentPromise: Promise<Prisma.TextContentGetPayload<{ include: { translations: true } }>>;
}

const ApplyDashboard = ({ textContentPromise }: ApplyDashboardProps) => {
    const { language } = useUserContext();
    const { organizationSettings } = useOrganizationSettingsContext();
    const termsOfMembershipUrl = getTermsOfMembershipUrl(organizationSettings, language);
    const privacyPolicyUrl = getPrivacyPolicyUrl(organizationSettings, language);
    // If there is no URL, consider the term accepted
    const [termsAccepted, setTermsAccepted] = useState({
        termsOfMembership: !termsOfMembershipUrl,
        privacyPolicy: !privacyPolicyUrl,
    });
    const [termsError, setTermsError] = useState(false);
    const shouldIncludeApplicationPrompt = !!organizationSettings.member_application_prompt;
    // Outcome is rendered inline: toasts auto-dismiss and applicants miss them, then resubmit
    const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const allTermsAccepted = termsAccepted.termsOfMembership && termsAccepted.privacyPolicy;

    // Resolves to the submitted email so the confirmation can echo it back
    const submitApplication = async (formData: FormData) => {
        setSubmitError(null);
        if (!allTermsAccepted) {
            setTermsError(true);
            throw new Error(LanguageTranslations.termsRequired[language]);
        }
        let errorMsg: string | undefined;
        try {
            errorMsg = await submitMemberApplication(formData);
            if (!errorMsg) return String(formData.get(GlobalConstants.EMAIL) ?? "");
        } catch {
            errorMsg = LanguageTranslations.failedApplicationSubmit[language];
        }
        throw new Error(errorMsg);
    };

    const acceptTerm = (term: keyof typeof termsAccepted, checked: boolean) => {
        setTermsAccepted((prev) => ({ ...prev, [term]: checked }));
        if (checked) setTermsError(false);
    };

    const termCheckbox = (term: keyof typeof termsAccepted, url: string, linkText: string) => (
        <FormControlLabel
            control={
                <Checkbox
                    checked={termsAccepted[term]}
                    onChange={(e) => acceptTerm(term, e.target.checked)}
                    color={termsError && !termsAccepted[term] ? "error" : "primary"}
                />
            }
            label={
                <Typography variant="body2" component="span">
                    {OrderLanguageTranslations.iHaveRead[language]}{" "}
                    <Link href={url} target="_blank" rel="noopener noreferrer">
                        {linkText}
                    </Link>
                </Typography>
            }
        />
    );

    if (submittedEmail !== null)
        return (
            <Stack spacing={2}>
                <ErrorBoundarySuspense>
                    <MembershipStepper activeStep={1} />
                </ErrorBoundarySuspense>
                <Alert severity="success">
                    <AlertTitle>{LanguageTranslations.applicationSubmitted[language]}</AlertTitle>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        {LanguageTranslations.applicationSubmittedBody[language](submittedEmail)}
                    </Typography>
                    <Typography variant="body2">
                        {LanguageTranslations.applicationReviewNote[language]}
                    </Typography>
                </Alert>
            </Stack>
        );

    return (
        <Stack spacing={2}>
            {/* The whole process is visible before the applicant commits to anything */}
            <ErrorBoundarySuspense>
                <MembershipStepper activeStep={0} />
            </ErrorBoundarySuspense>
            <TextContent textContentPromise={textContentPromise} />
            <Form
                name={GlobalConstants.APPLY}
                buttonLabel={LanguageTranslations.apply[language]}
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
                              [GlobalConstants.MEMBER_APPLICATION_PROMPT as string]:
                                  organizationSettings.member_application_prompt as string,
                          }
                        : {}
                }
                readOnly={false}
                editable={false}
                onSuccess={setSubmittedEmail}
                onError={setSubmitError}
            >
                {/* Terms sit right above the submit button and are checked on submit */}
                <Stack>
                    {termsOfMembershipUrl &&
                        termCheckbox(
                            "termsOfMembership",
                            termsOfMembershipUrl,
                            LanguageTranslations.termsOfMembership[language],
                        )}
                    {privacyPolicyUrl &&
                        termCheckbox(
                            "privacyPolicy",
                            privacyPolicyUrl,
                            OrderLanguageTranslations.privacyPolicy[language],
                        )}
                </Stack>
            </Form>
            {submitError && <Alert severity="error">{submitError}</Alert>}
        </Stack>
    );
};

export default ApplyDashboard;
