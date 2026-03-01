"use server";
import ProfileDashboard from "./ProfileDashboard";
import { getLoggedInUser } from "../../lib/user-helpers";
import { prisma } from "../../../prisma/prisma-client";

const ProfilePage = async () => {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) throw new Error("Not authorized to view profile");

    const tasksPromise = prisma.task.findMany({
        where: { OR: [{ assignee_id: loggedInUser.id }, { reviewer_id: loggedInUser.id }] },
        include: {
            assignee: {
                select: {
                    id: true,
                    nickname: true,
                },
            },
            reviewer: {
                select: {
                    id: true,
                    nickname: true,
                },
            },
            skill_badges: true,
        },
    });
    const eventsPromise = prisma.event.findMany({
        where: {
            OR: [
                { host_id: loggedInUser.id },
                {
                    tickets: {
                        some: {
                            event_participants: {
                                some: {
                                    user_id: loggedInUser.id,
                                },
                            },
                        },
                    },
                },
                { event_reserves: { some: { user_id: loggedInUser.id } } },
            ],
        },
        include: {
            location: true,
            host: {
                select: {
                    id: true,
                },
            },
            tickets: {
                include: {
                    event_participants: true,
                },
            },
            event_reserves: true,
        },
    });
    const skillBadgesPromise = prisma.skillBadge.findMany({ include: { user_skill_badges: true } });

    return (
        <ProfileDashboard
            tasksPromise={tasksPromise}
            eventsPromise={eventsPromise}
            skillBadgesPromise={skillBadgesPromise}
        />
    );
};

export default ProfilePage;
