import { Text, Button } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import mailTheme from "../mail-theme";
import { FC } from "react";
import { Prisma } from "@prisma/client";
import GlobalConstants from "../../../GlobalConstants";
import { getAbsoluteUrl } from "../../definitions";

/**
 * Props for the MembershipExpiresReminderTemplate component.
 * @property organizationSettings - The settings of the organization.
 * @property event - The event details.
 */
interface IOpenEventSpotTemplateProps {
    event: Prisma.EventGetPayload<true>;
}

const OpenEventSpotTemplate: FC<IOpenEventSpotTemplateProps> = ({ event }) => {
    if (!event) throw new Error("Event not found");

    return (
        <MailTemplate>
            <Text>A spot has opened up for the event: {event.title}</Text>
            <Button
                style={mailTheme.components.button}
                href={getAbsoluteUrl([GlobalConstants.EVENT], {
                    [GlobalConstants.EVENT_ID]: event.id,
                    [GlobalConstants.TAB]: "Tickets",
                })}
            >
                claim your ticket now!
            </Button>
        </MailTemplate>
    );
};

export default OpenEventSpotTemplate;
