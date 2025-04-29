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
}

const EventCancelledTemplate: FC<EventCancelledTemplateProps> = ({ event }) => {
    return (
        <MailTemplate>
            <Text>{`The event ${event[GlobalConstants.TITLE]} has been cancelled. Visit ${process.env.NEXT_PUBLIC_API_URL}/${GlobalConstants.CALENDAR}/${event[GlobalConstants.ID]} for more details.`}</Text>
            {(event[GlobalConstants.FULL_TICKET_PRICE] as number) > 0 && (
                <Text>{`If you paid for your ticket, please contact ${process.env.EMAIL} for a refund.`}</Text>
            )}
        </MailTemplate>
    );
};

export default EventCancelledTemplate;
