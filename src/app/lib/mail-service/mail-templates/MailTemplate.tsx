import { FC, ReactNode } from "react";
import { Html, Head, Body, Container, Heading, Button } from "@react-email/components";
import mailTheme from "../mail-theme";
import { getAbsoluteUrl } from "../../utils";
import GlobalConstants from "../../../GlobalConstants";
import { getOrganizationName } from "../../organization-settings-actions";

interface MailTemplateProps {
    children?: ReactNode;
    html?: string;
}

const MailTemplate: FC<MailTemplateProps> = async ({ children, html }) => {
    const renderHtml = () => {
        if (!html) return null;
        return <div dangerouslySetInnerHTML={{ __html: html }} />;
    };

    const organizationName = await getOrganizationName();

    return (
        <Html>
            <Head />
            <Body
                style={{
                    display: "flex",
                    padding: "16px",
                    textAlign: "center",
                    backgroundColor: mailTheme.palette.background.paper,
                    color: mailTheme.palette.text.primary,
                    ...mailTheme.typography.body1,
                }}
            >
                <Container>
                    <Heading
                        style={{
                            ...mailTheme.typography.h3,
                        }}
                    >
                        {organizationName}
                    </Heading>
                    <Container style={{ color: mailTheme.palette.text.primary, padding: "16px" }}>
                        {children}
                        {renderHtml()}
                    </Container>
                    <Button style={mailTheme.components.button} href={getAbsoluteUrl()}>
                        visit us
                    </Button>
                    <div
                        style={{
                            marginTop: "16px",
                            color: mailTheme.palette.text.secondary,
                            fontSize: "12px",
                        }}
                    >
                        <a
                            href={getAbsoluteUrl([GlobalConstants.PROFILE])}
                            style={{
                                color: mailTheme.palette.primary.main,
                                textDecoration: "underline",
                            }}
                        >
                            Unsubscribe or manage email preferences
                        </a>
                    </div>
                </Container>
            </Body>
        </Html>
    );
};

export default MailTemplate;
