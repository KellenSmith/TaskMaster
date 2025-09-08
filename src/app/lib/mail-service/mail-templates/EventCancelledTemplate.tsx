import { Button, Text } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";
import GlobalConstants from "../../../GlobalConstants";
import { getAbsoluteUrl } from "../../utils";

interface EventCancelledTemplateProps {
    event: {
        id: string;
        title: string;
    };
}

const EventCancelledTemplate: FC<EventCancelledTemplateProps> = ({ event }) => {
    return (
        <MailTemplate>
            <Text>{`The event ${event[GlobalConstants.TITLE]} has been cancelled. Go to the event for more details.`}</Text>
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
