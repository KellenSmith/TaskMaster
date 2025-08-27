import { Button, Text } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";
import GlobalConstants from "../../../GlobalConstants";
import { getAbsoluteUrl } from "../../definitions";

interface EventCancelledTemplateProps {
    event: {
        id: string;
        title: string;
    };
    organizationName: string;
}

const EventCancelledTemplate: FC<EventCancelledTemplateProps> = ({ event, organizationName }) => {
    return (
        <MailTemplate organizationName={organizationName}>
            <Text>{`The event ${event[GlobalConstants.TITLE]} has been cancelled. Go to the event for more details.`}</Text>
            <Button
                href={getAbsoluteUrl([GlobalConstants.EVENT], {
                    [GlobalConstants.EVENT_ID]: event.id,
                })}
            >
                View Event
            </Button>
        </MailTemplate>
    );
};

export default EventCancelledTemplate;
