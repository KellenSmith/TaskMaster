"use server";
import { unstable_cache } from "next/cache";
import CalendarDashboard from "./CalendarDashboard";
import { getAllEvents } from "../../lib/event-actions";
import GlobalConstants from "../../GlobalConstants";
import { prisma } from "../../../prisma/prisma-client";

const CalendarPage = async () => {
    const eventsPromise = unstable_cache(getAllEvents, [], {
        tags: [GlobalConstants.EVENT],
    })();

    return <CalendarDashboard eventsPromise={eventsPromise} />;
};

export default CalendarPage;
