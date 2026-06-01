// ...existing code...
import SendoutDashboard from "./SendoutDashboard";
import { prisma } from "../../../prisma/prisma-client";
import { cacheTag } from "next/cache";
import GlobalConstants from "../../GlobalConstants";

const getCachedNewsLetterJobs = async () => {
    "use cache";
    cacheTag(GlobalConstants.SENDOUT);

    return await prisma.newsletterJob.findMany({
        orderBy: { created_at: "desc" },
    });
};

const SendoutPage = () => {
    const newsLetterJobsPromise = getCachedNewsLetterJobs();
    return <SendoutDashboard newsLetterJobsPromise={newsLetterJobsPromise} />;
};
export default SendoutPage;
