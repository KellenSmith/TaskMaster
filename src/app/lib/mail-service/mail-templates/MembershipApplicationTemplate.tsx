import { Text, Section, Column, Row, Button } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";
import mailTheme from "../mail-theme";
import GlobalConstants from "../../../GlobalConstants";
import { MembershipApplicationSchema } from "../../zod-schemas";
import z from "zod";
import { getAbsoluteUrl } from "../../definitions";

/**
 * Props for the MembershipApplicationTemplate component.
 * @property organizationName - The name of the organization.
 * @property userEmail - The email address of the user.
 * @property password - The password assigned to the user.
 */
interface IMembershipApplicationTemplateProps {
    organizationName: string;
    parsedFieldValues: z.infer<typeof MembershipApplicationSchema>;
}

const MembershipApplicationTemplate: FC<IMembershipApplicationTemplateProps> = ({
    organizationName,
    parsedFieldValues,
}) => {
    return (
        <MailTemplate organizationName={organizationName}>
            <Section style={{ textAlign: "left" }}>
                <Text style={{ fontSize: "18px", fontWeight: "bold" }}>
                    {`New Membership Application from ${parsedFieldValues.nickname}`}
                </Text>
            </Section>
            <Section style={{ textAlign: "left" }}>
                <Row>
                    <Column>
                        <Text style={{ fontWeight: "bold" }}>Email:</Text>
                    </Column>
                    <Column>
                        <Text>{parsedFieldValues.email}</Text>
                    </Column>
                </Row>
            </Section>
            <Section style={{ textAlign: "left" }}>
                {parsedFieldValues.memberApplicationPrompt &&
                    parsedFieldValues.memberApplicationPrompt.split("\n").map((line, index) => (
                        <Text key={index} style={{ marginTop: "10px" }}>
                            {line}
                        </Text>
                    ))}
            </Section>
            <Button
                style={mailTheme.components.button}
                href={getAbsoluteUrl([GlobalConstants.MEMBERS])}
            >
                manage members
            </Button>
        </MailTemplate>
    );
};

export default MembershipApplicationTemplate;
