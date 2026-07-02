// ...existing code...
import SendoutDashboard from "./SendoutDashboard";
import { prisma } from "../../../prisma/prisma-client";
import ProtectedPage from "../../ProtectedPage";
import GlobalConstants from "../../GlobalConstants";

const getCachedNewsLetterJobs = async () => {
    return await prisma.newsletterJob.findMany({
        orderBy: { created_at: "desc" },
    });
};

const SendoutPage = () => {
    const newsLetterJobsPromise = getCachedNewsLetterJobs();
    return (
        <ProtectedPage name={GlobalConstants.SENDOUT}>
            <SendoutDashboard newsLetterJobsPromise={newsLetterJobsPromise} />
        </ProtectedPage>
    );
};
export default SendoutPage;
