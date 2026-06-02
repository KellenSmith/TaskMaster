// ...existing code...
import SendoutDashboard from "./SendoutDashboard";
import { prisma } from "../../../prisma/prisma-client";

const getCachedNewsLetterJobs = async () => {
    return await prisma.newsletterJob.findMany({
        orderBy: { created_at: "desc" },
    });
};

const SendoutPage = () => {
    const newsLetterJobsPromise = getCachedNewsLetterJobs();
    return <SendoutDashboard newsLetterJobsPromise={newsLetterJobsPromise} />;
};
export default SendoutPage;
