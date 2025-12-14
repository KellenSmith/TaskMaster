import ContactDashboard from "./ContactDashboard";
import GlobalConstants from "../../GlobalConstants";
import { getTextContent } from "../../lib/text-content-actions";
import { FC } from "react";

const ContactPage: FC = () => {
    const textContentPromise = getTextContent(GlobalConstants.CONTACT);

    return <ContactDashboard textContentPromise={textContentPromise} />;
};

export default ContactPage;
