import { FC } from "react";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import { prisma } from "../../../../prisma/prisma-client";
import { Prisma } from "@prisma/client";
import VolunteerLeaderboardClient from "./VolunteerLeaderboardClient";

interface VolunteerLeaderboardProps {
    searchParams: Promise<{ [year: string]: string }>;
}

const VolunteerLeaderboardPage: FC<VolunteerLeaderboardProps> = async ({ searchParams }) => {
    const year = (await searchParams)?.year || new Date().getFullYear().toString();

    const volunteerTasksForYear: Prisma.TaskGetPayload<{ include: { assignee: true } }>[] = await prisma.task.findMany({
        where: {
            start_time: {
                gte: new Date(`${year}-01-01`),
                lt: new Date(`${parseInt(year) + 1}-01-01`),
            },
            NOT: {
                assignee: null,
            }
        },
        include: {
            assignee: true,
        }
    })
    const uniqueVolunteerNicknames = Array.from(new Set(volunteerTasksForYear.map(task => task.assignee.nickname)));

    const assigneeVolunteerHours = uniqueVolunteerNicknames.map(assigneeNickname => {
        const tasksForAssignee = volunteerTasksForYear.filter(task => task.assignee.nickname === assigneeNickname);
        const totalHours = tasksForAssignee.reduce((sum, task) => {
            const hours = (task.end_time.getTime() - task.start_time.getTime()) / (1000 * 60 * 60);
            return sum + hours;
        }, 0);
        return {
            nickname: assigneeNickname,
            hours: totalHours,
        };
    });

    return (
        <ErrorBoundarySuspense>
            <VolunteerLeaderboardClient assigneeVolunteerHours={assigneeVolunteerHours} year={year} />
        </ErrorBoundarySuspense>
    );
};

export default VolunteerLeaderboardPage;
