import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import SendoutDashboard from "./SendoutDashboard";
import { getAllNewsletterJobs } from "../../lib/mail-service/newsletter-actions";
import GlobalConstants from "../../GlobalConstants";

const SendoutPage = () => {
    const newsLetterJobsPromise = getAllNewsletterJobs();
    return (
        <ErrorBoundarySuspense>
            <SendoutDashboard newsLetterJobsPromise={newsLetterJobsPromise} />
        </ErrorBoundarySuspense>
    );
};
export default SendoutPage;
