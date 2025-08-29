import { unstable_cache } from "next/cache";
import ContactDashboard from "./ContactDashboard";
import GlobalConstants from "../../GlobalConstants";
import { getTextContent } from "../../lib/text-content-actions";

const ContactPage: React.FC = () => {
    const textContentPromise = unstable_cache(getTextContent, [GlobalConstants.CONTACT], {
        tags: [GlobalConstants.TEXT_CONTENT],
    })(GlobalConstants.CONTACT);

    return <ContactDashboard textContentPromise={textContentPromise} />;
};

export default ContactPage;
