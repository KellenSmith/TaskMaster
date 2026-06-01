import ContactDashboard from "./ContactDashboard";
import GlobalConstants from "../../GlobalConstants";
import { getCachedTextContent } from "../../lib/text-content-actions";
import { FC } from "react";

const ContactPage: FC = () => {
    const textContentPromise = getCachedTextContent(GlobalConstants.CONTACT);

    return <ContactDashboard textContentPromise={textContentPromise} />;
};

export default ContactPage;
