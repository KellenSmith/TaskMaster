import ContactDashboard from "./ContactDashboard";
import GlobalConstants from "../../GlobalConstants";
import { getCachedTextContent } from "../../lib/text-content-actions";
import { FC } from "react";
import ProtectedPage from "../../ProtectedPage";

const ContactPage: FC = () => {
    const textContentPromise = getCachedTextContent(GlobalConstants.CONTACT);

    return (
        <ProtectedPage name={GlobalConstants.CONTACT}>
            <ContactDashboard textContentPromise={textContentPromise} />
        </ProtectedPage>
    );
};

export default ContactPage;
