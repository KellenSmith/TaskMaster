// ...existing code...
import SendoutDashboard from "./SendoutDashboard";
import { prisma } from "../../../prisma/prisma-client";

const SendoutPage = () => {
    const newsLetterJobsPromise = prisma.newsletterJob.findMany({
        orderBy: { created_at: "desc" },
    });
    return <SendoutDashboard newsLetterJobsPromise={newsLetterJobsPromise} />;
};
export default SendoutPage;
