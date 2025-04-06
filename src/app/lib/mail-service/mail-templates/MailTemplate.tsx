import { FC, ReactNode } from "react";
import { Html, Head, Body, Container, Heading, Button } from "@react-email/components";
import GlobalConstants from "../../../GlobalConstants";
import mailTheme from "../mail-theme";

interface MailTemplateProps {
    children: ReactNode;
}

const MailTemplate: FC<MailTemplateProps> = ({ children }) => {
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
