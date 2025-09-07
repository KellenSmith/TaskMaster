import { Text, Section, Column, Row, Button } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";
import mailTheme from "../mail-theme";
import GlobalConstants from "../../../GlobalConstants";
import { MembershipApplicationSchema } from "../../zod-schemas";
import z from "zod";
import { getAbsoluteUrl } from "../../utils";

/**
 * Props for the MembershipApplicationTemplate component.
 * @property parsedFFieldValues - The parsed field values from the membership application form.
 */
interface IMembershipApplicationTemplateProps {
    parsedFieldValues: z.infer<typeof MembershipApplicationSchema>;
}

const MembershipApplicationTemplate: FC<IMembershipApplicationTemplateProps> = ({
    parsedFieldValues,
}) => {
    return (
        <MailTemplate>
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
            {parsedFieldValues.member_application_prompt && (
                <Section style={{ textAlign: "left" }}>
                    <Column>
                        <Text style={{ fontWeight: "bold" }}>Message:</Text>
                    </Column>
                    <Column>
                        {parsedFieldValues.member_application_prompt
                            .split("\n")
                            .map((line, index) => (
                                <Text key={index} style={{ marginTop: "10px" }}>
                                    {line}
                                </Text>
                            ))}
                    </Column>
                </Section>
            )}
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
