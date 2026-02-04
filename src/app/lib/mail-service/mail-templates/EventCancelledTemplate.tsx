import { Button, Text } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";
import GlobalConstants from "../../../GlobalConstants";
import { getAbsoluteUrl } from "../../utils";
import { Prisma } from "../../../../prisma/generated/client";

interface EventCancelledTemplateProps {
    event: Prisma.EventGetPayload<{ select: { id: true; title: true } }>;
}

const EventCancelledTemplate: FC<EventCancelledTemplateProps> = ({ event }) => {
    return (
        <MailTemplate>
            <Text>{`The event ${event.title} has been cancelled. Go to the event for more details.`}</Text>
            <Button
                href={getAbsoluteUrl([GlobalConstants.CALENDAR_POST], {
                    [GlobalConstants.EVENT_ID]: event.id,
                })}
            >
                View Event
            </Button>
        </MailTemplate>
    );
};

export default EventCancelledTemplate;
