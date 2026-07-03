import { FC } from "react";
import { prisma } from "../../../prisma/prisma-client";
import VolunteerLeaderboardClient from "./VolunteerLeaderboardClient";
import { Prisma } from "../../../prisma/generated/client";
import dayjs from "dayjs";
import ProtectedPage from "../../ProtectedPage";
import GlobalConstants from "../../GlobalConstants";

interface VolunteerLeaderboardProps {
    searchParams: Promise<{ [year: string]: string }>;
}

const getCachedAssigneeVolunteerHours = async (year: string) => {
    const volunteerTasksForYear: Prisma.TaskGetPayload<{ include: { assignee: true } }>[] =
        await prisma.task.findMany({
            where: {
                start_time: {
                    gte: new Date(`${year}-01-01`),
                    lt: new Date(`${parseInt(year) + 1}-01-01`),
                },
                NOT: {
                    assignee: null,
                },
            },
            include: {
                assignee: true,
            },
        });
    const uniqueVolunteerNicknames = Array.from(
        new Set(volunteerTasksForYear.map((task) => task.assignee?.nickname)),
    ).filter(Boolean) as string[];
    const assigneeVolunteerHours = uniqueVolunteerNicknames.map((assigneeNickname) => {
        const tasksForAssignee = volunteerTasksForYear.filter(
            (task) => task.assignee && task.assignee.nickname === assigneeNickname,
        );
        const totalHours = tasksForAssignee.reduce((sum, task) => {
            const hours = task.start_time
                ? (task.end_time.getTime() - task.start_time.getTime()) / (1000 * 60 * 60)
                : 0;
            return sum + hours;
        }, 0);
        return {
            nickname: assigneeNickname,
            hours: totalHours,
        };
    });

    return assigneeVolunteerHours;
};

const VolunteerLeaderboardPage: FC<VolunteerLeaderboardProps> = async ({ searchParams }) => {
    const year = (await searchParams)?.year || dayjs.utc().year().toString();

    const assigneeVolunteerHoursPromise = getCachedAssigneeVolunteerHours(year);

    return (
        <ProtectedPage name={GlobalConstants.VOLUNTEER_LEADERBOARD}>
            <VolunteerLeaderboardClient
                assigneeVolunteerHoursPromise={assigneeVolunteerHoursPromise}
                year={year}
            />
        </ProtectedPage>
    );
};

export default VolunteerLeaderboardPage;
