import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import SendoutDashboard from "./SendoutDashboard";
import { prisma } from "../../../prisma/prisma-client";

const SendoutPage = () => {
    const newsLetterJobsPromise = prisma.newsletterJob.findMany({
        orderBy: { created_at: "desc" },
    });
    return (
        <ErrorBoundarySuspense>
            <SendoutDashboard newsLetterJobsPromise={newsLetterJobsPromise} />
        </ErrorBoundarySuspense>
    );
};
export default SendoutPage;
