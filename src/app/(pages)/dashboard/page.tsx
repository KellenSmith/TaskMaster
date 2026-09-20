import { connection } from "next/server";
import Dashboard from "./Dashboard";
import ProtectedPage from "../../ProtectedPage";
import GlobalConstants from "../../GlobalConstants";
import { getUpcomingEventParticipants } from "../../lib/event-participant-helpers";

const DashboardPage = async () => {
    await connection();

    const ticketInfoPromise = getUpcomingEventParticipants();

    return (
        <ProtectedPage name={GlobalConstants.DASHBOARD}>
            <Dashboard ticketInfoPromise={ticketInfoPromise} />
        </ProtectedPage>
    );
};

export default DashboardPage;
