import { Text, Button } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import mailTheme from "../mail-theme";
import { FC } from "react";
import { Prisma } from "@prisma/client";
import { NextURL } from "next/dist/server/web/next-url";
import GlobalConstants from "../../../GlobalConstants";

/**
 * Props for the MembershipExpiresReminderTemplate component.
 * @property organizationSettings - The settings of the organization.
 */
interface IOpenEventSpotTemplateProps {
    organizationName: string;
    event: Prisma.EventGetPayload<true>;
}

const OpenEventSpotTemplate: FC<IOpenEventSpotTemplateProps> = ({ organizationName, event }) => {
    if (!event) throw new Error("Event not found");

    const eventUrl = new NextURL(GlobalConstants.EVENT, process.env.VERCEL_URL);
    eventUrl.searchParams.set(GlobalConstants.EVENT_ID, event.id);
    eventUrl.searchParams.set("tab", "Tickets");

    return (
        <MailTemplate organizationName={organizationName}>
            <Text>A spot has opened up for the event: {event.title}</Text>
            <Button style={mailTheme.components.button} href={eventUrl.toString()}>
                claim your ticket now!
            </Button>
        </MailTemplate>
    );
};

export default OpenEventSpotTemplate;
