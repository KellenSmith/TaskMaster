import { Text, Section, Column, Row, Button } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";
import { Prisma } from "@prisma/client";
import mailTheme from "../mail-theme";
import GlobalConstants from "../../../GlobalConstants";

/**
 * Props for the MembershipApplicationTemplate component.
 * @property organizationName - The name of the organization.
 * @property userEmail - The email address of the user.
 * @property password - The password assigned to the user.
 */
interface IMembershipApplicationTemplateProps {
    organizationName: string;
    user: Prisma.UserCreateInput;
    applicationMessage: string;
}

const MembershipApplicationTemplate: FC<IMembershipApplicationTemplateProps> = ({
    organizationName,
    user,
    applicationMessage,
}) => {
    return (
        <MailTemplate organizationName={organizationName}>
            <Section style={{ textAlign: "left" }}>
                <Text style={{ fontSize: "18px", fontWeight: "bold" }}>
                    {`New Membership Application from ${user.nickname}`}
                </Text>
            </Section>
            <Section style={{ textAlign: "left" }}>
                <Row>
                    <Column>
                        <Text style={{ fontWeight: "bold" }}>Email:</Text>
                    </Column>
                    <Column>
                        <Text>{user.email}</Text>
                    </Column>
                </Row>
            </Section>
            <Section style={{ textAlign: "left" }}>
                {applicationMessage.split("\n").map((line) => (
                    <Text style={{ marginTop: "10px" }}>{line}</Text>
                ))}
            </Section>
            <Button
                style={mailTheme.components.button}
                href={`${process.env.VERCEL_URL}/${GlobalConstants.MEMBERS}`}
            >
                manage members
            </Button>
        </MailTemplate>
    );
};

export default MembershipApplicationTemplate;
