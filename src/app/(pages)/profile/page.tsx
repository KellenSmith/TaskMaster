"use server";
import ProfileDashboard from "./ProfileDashboard";
import { getLoggedInUser } from "../../lib/user-helpers";
import { prisma } from "../../../prisma/prisma-client";

const getCachedUserTasks = async (loggedInUserId: string) => {
    return await prisma.task.findMany({
        where: { OR: [{ assignee_id: loggedInUserId }, { reviewer_id: loggedInUserId }] },
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
};

const getCachedUserEvents = async (loggedInUserId: string) => {
    return await prisma.event.findMany({
        where: {
            OR: [
                { host_id: loggedInUserId },
                {
                    tickets: {
                        some: {
                            event_participants: {
                                some: {
                                    user_id: loggedInUserId,
                                },
                            },
                        },
                    },
                },
                { event_reserves: { some: { user_id: loggedInUserId } } },
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
};

const getCachedSkillBadges = async () => {
    return await prisma.skillBadge.findMany({ include: { user_skill_badges: true } });
};

const ProfilePage = async () => {
    const loggedInUser = await getLoggedInUser();

    const tasksPromise = loggedInUser
        ? getCachedUserTasks(loggedInUser.id)
        : Promise.reject(new Error("Not authorized to view tasks"));
    const eventsPromise = loggedInUser
        ? getCachedUserEvents(loggedInUser.id)
        : Promise.reject(new Error("Not authorized to view events"));
    const skillBadgesPromise = getCachedSkillBadges();

    return (
        <ProfileDashboard
            tasksPromise={tasksPromise}
            eventsPromise={eventsPromise}
            skillBadgesPromise={skillBadgesPromise}
        />
    );
};

export default ProfilePage;
