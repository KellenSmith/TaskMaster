import { Text } from "@react-email/components";
import MailTemplate from "./MailTemplate";
import { FC } from "react";
import GlobalConstants from "../../../GlobalConstants";

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
            <Text>{`The event ${event[GlobalConstants.TITLE]} has been cancelled. Visit ${process.env.VERCEL_URL}/${GlobalConstants.EVENT}?eventId=${event[GlobalConstants.ID]} for more details.`}</Text>
        </MailTemplate>
    );
};

export default EventCancelledTemplate;
