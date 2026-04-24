import { FC } from "react";
// ...existing code...
import { prisma } from "../../../prisma/prisma-client";
import VolunteerLeaderboardClient from "./VolunteerLeaderboardClient";
import { Prisma } from "../../../prisma/generated/client";
import dayjs from "../../lib/dayjs";

interface VolunteerLeaderboardProps {
    searchParams: Promise<{ [year: string]: string }>;
}

const VolunteerLeaderboardPage: FC<VolunteerLeaderboardProps> = async ({ searchParams }) => {
    const year = (await searchParams)?.year || dayjs().toDate().getFullYear().toString();

    const volunteerTasksForYear: Prisma.TaskGetPayload<{ include: { assignee: true } }>[] =
        await prisma.task.findMany({
            where: {
                start_time: {
                    gte: dayjs(`${year}-01-01`).toDate(),
                    lt: dayjs(`${parseInt(year) + 1}-01-01`).toDate(),
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
                ? dayjs(task.end_time).diff(dayjs(task.start_time), "hours", true)
                : 0;
            return sum + hours;
        }, 0);
        return {
            nickname: assigneeNickname,
            hours: totalHours,
        };
    });

    return (
        <VolunteerLeaderboardClient assigneeVolunteerHours={assigneeVolunteerHours} year={year} />
    );
};

export default VolunteerLeaderboardPage;
