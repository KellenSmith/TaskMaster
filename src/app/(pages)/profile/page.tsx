"use server";
import ProfileDashboard from "./ProfileDashboard";
import { getLoggedInUser } from "../../lib/user-helpers";
import { prisma } from "../../../prisma/prisma-client";
import { connection } from "next/server";
import ProtectedPage from "../../ProtectedPage";
import GlobalConstants from "../../GlobalConstants";

const assertIsAuthorized = async () => {
    const loggedInUser = await getLoggedInUser();
    if (!loggedInUser) {
        throw new Error("Unauthorized");
    }
    return loggedInUser;
};

const getCachedUserTasks = async () => {
    const loggedInUser = await assertIsAuthorized();
    return await prisma.task.findMany({
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
};

const getCachedUserEvents = async () => {
    const loggedInUser = await assertIsAuthorized();
    return await prisma.event.findMany({
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
};

const getCachedSkillBadges = async () => {
    await assertIsAuthorized();
    return await prisma.skillBadge.findMany({ include: { user_skill_badges: true } });
};

const ProfilePage = async () => {
    await connection();

    const tasksPromise = getCachedUserTasks();
    const eventsPromise = getCachedUserEvents();
    const skillBadgesPromise = getCachedSkillBadges();

    return (
        <ProtectedPage name={GlobalConstants.PROFILE}>
            <ProfileDashboard
                tasksPromise={tasksPromise}
                eventsPromise={eventsPromise}
                skillBadgesPromise={skillBadgesPromise}
            />
        </ProtectedPage>
    );
};

export default ProfilePage;
