"use client";
import GlobalConstants from "../../GlobalConstants";
import { submitMemberApplication } from "../../lib/user-actions";
import Form from "../../ui/form/Form";
import { MembershipApplicationSchema } from "../../lib/zod-schemas";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";
import { useState } from "react";
import { Checkbox, Link, Stack, Typography } from "@mui/material";
import LanguageTranslations from "./LanguageTranslations";
import OrderLanguageTranslations from "../order/LanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import { getPrivacyPolicyUrl, getTermsOfMembershipUrl } from "../../ui/utils";

const ApplyPage = () => {
    const { language } = useUserContext();
    const { organizationSettings } = useOrganizationSettingsContext();
    const termsOfMembershipUrl = getTermsOfMembershipUrl(organizationSettings, language);
    const privacyPolicyUrl = getPrivacyPolicyUrl(organizationSettings, language);
    // If there is no URL, consider the term accepted
    const [termsAccepted, setTermsAccepted] = useState({
        termsOfMembership: !termsOfMembershipUrl,
        privacyPolicy: !privacyPolicyUrl,
    });
    const shouldIncludeApplicationPrompt = !!organizationSettings.member_application_prompt;

    const submitApplication = async (formData: FormData) => {
        try {
            await submitMemberApplication(formData);
            return LanguageTranslations.applicationSubmitted[language];
        } catch {
            throw new Error(LanguageTranslations.failedApplicationSubmit[language]);
        }
    };

    return (
        <Stack spacing={1}>
            <Typography variant="h6">{LanguageTranslations.makeSureYouRead[language]}</Typography>
            {termsOfMembershipUrl && (
                <Stack direction="row" alignItems={"center"}>
                    <Checkbox
                        checked={termsAccepted.termsOfMembership}
                        onChange={(e) =>
                            setTermsAccepted({
                                ...termsAccepted,
                                termsOfMembership: e.target.checked,
                            })
                        }
                        required
                    />
                    <Typography
                        variant="body2"
                        sx={{
                            display: "inline",
                            wordBreak: "keep-all",
                            hyphens: "none",
                            marginRight: 1,
                        }}
                    >
                        {OrderLanguageTranslations.iHaveRead[language]}{" "}
                    </Typography>
                    <Link
                        href={termsOfMembershipUrl as string}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {LanguageTranslations.termsOfMembership[language]}
                    </Link>
                </Stack>
            )}

            <Stack direction="row" alignItems={"center"}>
                <Checkbox
                    checked={termsAccepted.privacyPolicy}
                    onChange={(e) =>
                        setTermsAccepted({
                            ...termsAccepted,
                            privacyPolicy: e.target.checked,
                        })
                    }
                    required
                />
                <Typography
                    variant="body2"
                    sx={{
                        display: "inline",
                        wordBreak: "keep-all",
                        hyphens: "none",
                        marginRight: 1,
                    }}
                >
                    {OrderLanguageTranslations.iHaveRead[language]}{" "}
                </Typography>
                {privacyPolicyUrl && (
                    <Link
                        href={privacyPolicyUrl as string}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {OrderLanguageTranslations.privacyPolicy[language]}
                    </Link>
                )}
            </Stack>

            <Form
                key={JSON.stringify(termsAccepted)}
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
                              [GlobalConstants.MEMBER_APPLICATION_PROMPT as string]:
                                  organizationSettings.member_application_prompt as string,
                          }
                        : {}
                }
                readOnly={!(termsAccepted.termsOfMembership && termsAccepted.privacyPolicy)}
                editable={false}
            />
        </Stack>
    );
};

export default ApplyPage;
