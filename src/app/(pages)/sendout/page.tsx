import { unstable_cache } from "next/cache";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import SendoutDashboard from "./SendoutDashboard";
import { getAllNewsletterJobs } from "../../lib/mail-service/newsletter-actions";
import GlobalConstants from "../../GlobalConstants";

const SendoutPage = () => {
    const newsLetterJobsPromise = unstable_cache(getAllNewsletterJobs, [], {
        tags: [GlobalConstants.SENDOUT],
    })();
    return (
        <ErrorBoundarySuspense>
            <SendoutDashboard newsLetterJobsPromise={newsLetterJobsPromise} />
        </ErrorBoundarySuspense>
    );
};
export default SendoutPage;
