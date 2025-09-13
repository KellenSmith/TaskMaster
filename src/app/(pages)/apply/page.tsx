"use client";
import GlobalConstants from "../../GlobalConstants";
import { submitMemberApplication } from "../../lib/user-actions";
import Form from "../../ui/form/Form";
import { MembershipApplicationSchema } from "../../lib/zod-schemas";
import { useOrganizationSettingsContext } from "../../context/OrganizationSettingsContext";
import { useMemo, useState } from "react";
import { Checkbox, FormControlLabel, Link, Stack, Typography } from "@mui/material";
import LanguageTranslations from "./LanguageTranslations";
import OrderLanguageTranslations from "../order/LanguageTranslations";
import { useUserContext } from "../../context/UserContext";
import { getPrivacyPolicyUrl, getTermsOfMembershipUrl } from "../../ui/utils";

const ApplyPage = () => {
    const { language } = useUserContext();
    const [termsAccepted, setTermsAccepted] = useState({
        termsOfMembership: false,
        privacyPolicy: false,
    });
    const { organizationSettings } = useOrganizationSettingsContext();
    const shouldIncludeApplicationPrompt = useMemo(
        (): boolean => !!organizationSettings.member_application_prompt,
        [organizationSettings],
    );

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
            <FormControlLabel
                sx={{
                    width: "100%",
                    margin: 0,
                    "& .MuiFormControlLabel-label": {
                        lineHeight: 1.4,
                        paddingLeft: 1,
                    },
                }}
                control={
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
                }
                label={
                    <Typography
                        variant="body2"
                        sx={{
                            display: "inline",
                            wordBreak: "keep-all",
                            hyphens: "none",
                        }}
                    >
                        {OrderLanguageTranslations.iHaveRead[language]}{" "}
                        <Link
                            href={getTermsOfMembershipUrl(organizationSettings, language)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {LanguageTranslations.termsOfMembership[language]}
                        </Link>
                    </Typography>
                }
            />
            <FormControlLabel
                sx={{
                    width: "100%",
                }}
                control={
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
                }
                label={
                    <Typography
                        variant="body2"
                        sx={{
                            display: "inline",
                            wordBreak: "keep-all",
                            hyphens: "none",
                        }}
                    >
                        {OrderLanguageTranslations.iHaveRead[language]}{" "}
                        <Link
                            href={getPrivacyPolicyUrl(organizationSettings, language)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {OrderLanguageTranslations.privacyPolicy[language]}
                        </Link>
                    </Typography>
                }
            />
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
                              [GlobalConstants.MEMBER_APPLICATION_PROMPT]:
                                  organizationSettings.member_application_prompt,
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
