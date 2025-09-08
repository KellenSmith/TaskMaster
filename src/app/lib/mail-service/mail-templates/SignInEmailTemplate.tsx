import { FC } from "react";
import { Text, Section, Button, Hr } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import mailTheme from "../mail-theme";

/**
 * Props for the SignInEmailTemplate component.
 * @property email - The email address of the user signing in.
 * @property url - The magic link URL for authentication.
 */
interface ISignInEmailTemplateProps {
    email: string;
    url: string;
}

const SignInEmailTemplate: FC<ISignInEmailTemplateProps> = ({ email, url }) => {
    return (
        <MailTemplate>
            <Section style={{ textAlign: "center", marginBottom: "32px" }}>
                <Text
                    style={{
                        ...mailTheme.typography.h5,
                        marginBottom: "16px",
                    }}
                >
                    Welcome back!
                </Text>
                <Text
                    style={{
                        ...mailTheme.typography.body1,
                        marginBottom: "0",
                    }}
                >
                    We received a request to sign in to your account for <strong>{email}</strong>.
                    Click the button below to continue.
                </Text>
            </Section>

            <Section style={{ textAlign: "center", margin: "32px 0" }}>
                <Button
                    href={url}
                    style={{
                        ...mailTheme.components.button,
                        padding: "12px 32px",
                    }}
                >
                    Sign in to your account
                </Button>
            </Section>

            <Hr
                style={{
                    margin: "32px 0",
                }}
            />

            <Section
                style={{
                    padding: "20px",
                    borderRadius: "6px",
                    marginBottom: "24px",
                }}
            >
                <Text
                    style={{
                        ...mailTheme.typography.subtitle1,
                        fontWeight: mailTheme.typography.fontWeightMedium,
                        marginBottom: "12px",
                    }}
                >
                    Security Information
                </Text>
                <Text
                    style={{
                        ...mailTheme.typography.body2,
                        marginBottom: "8px",
                    }}
                >
                    • This link will expire in 24 hours for your security
                </Text>
                <Text
                    style={{
                        ...mailTheme.typography.body2,
                        marginBottom: "8px",
                    }}
                >
                    • The link can only be used once
                </Text>
                <Text
                    style={{
                        ...mailTheme.typography.body2,
                        marginBottom: "0",
                    }}
                >
                    {"• If you didn't request this, you can safely ignore this email"}
                </Text>
            </Section>

            <Section style={{ textAlign: "center" }}>
                <Text
                    style={{
                        ...mailTheme.typography.caption,
                    }}
                >
                    Having trouble with the button?{" "}
                    <a
                        href={url}
                        style={{
                            textDecoration: "none",
                        }}
                    >
                        Copy and paste this link into your browser
                    </a>
                </Text>
            </Section>
        </MailTemplate>
    );
};

export default SignInEmailTemplate;
