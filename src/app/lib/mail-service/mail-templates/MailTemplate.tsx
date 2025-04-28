import { FC, ReactNode } from "react";
import { Html, Head, Body, Container, Heading, Button } from "@react-email/components";
import GlobalConstants from "../../../GlobalConstants";
import mailTheme from "../mail-theme";
import DOMPurify from "isomorphic-dompurify";

interface MailTemplateProps {
    children?: ReactNode;
    html?: string;
}

const MailTemplate: FC<MailTemplateProps> = ({ children, html }) => {
    const sanitizeHtml = (): string => {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: [
                "b",
                "i",
                "em",
                "strong",
                "a",
                "p",
                "br",
                "ul",
                "ol",
                "li",
                "h1",
                "h2",
                "h3",
                "h4",
            ],
            ALLOWED_ATTR: ["href", "target"],
        });
    };

    const renderHtml = () => {
        if (!html) return null;
        return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml() }} />;
    };

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
                        {process.env.NEXT_PUBLIC_ORG_NAME}
                    </Heading>
                    <Container style={{ color: mailTheme.palette.text.primary }}>
                        {children}
                        {renderHtml()}
                    </Container>
                    <Button
                        style={mailTheme.components.button}
                        href={`${process.env.NEXT_PUBLIC_API_URL}/${GlobalConstants.LOGIN}`}
                    >
                        visit us
                    </Button>
                </Container>
            </Body>
        </Html>
    );
};

export default MailTemplate;
