import { Text } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";
import GlobalConstants from "../../../GlobalConstants";

interface EventCancelledTemplateProps {
    event: {
        id: string;
        title: string;
        fullTicketPrice: number;
    };
    organizationName: string;
    organizationEmail: string;
}

const EventCancelledTemplate: FC<EventCancelledTemplateProps> = ({
    event,
    organizationName,
    organizationEmail,
}) => {
    return (
        <MailTemplate organizationName={organizationName}>
            <Text>{`The event ${event[GlobalConstants.TITLE]} has been cancelled. Visit ${process.env.VERCEL_URL}/${GlobalConstants.CALENDAR}event?eventId=${event[GlobalConstants.ID]} for more details.`}</Text>
            {(event[GlobalConstants.FULL_TICKET_PRICE] as number) > 0 && (
                <Text>{`If you paid for your ticket, please contact ${organizationEmail} for a refund.`}</Text>
            )}
        </MailTemplate>
    );
};

export default EventCancelledTemplate;
