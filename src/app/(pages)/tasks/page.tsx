import KanBanBoard from "../../ui/kanban-board/KanBanBoard";
import { getCachedActiveMembers, getLoggedInUser } from "../../lib/user-helpers";
import { isUserAdmin } from "../../lib/utils";
import { prisma } from "../../../prisma/prisma-client";

const getCachedTasks = async () => {
    return await prisma.task.findMany({
        where: {
            event_id: null,
        },
        include: {
            assignee: {
                select: {
                    id: true,
                    nickname: true,
                },
            },
            skill_badges: true,
        },
    });
};

const TasksPage = async () => {
    const loggedInUser = await getLoggedInUser();
    const tasksPromise = getCachedTasks();
    const activeMembersPromise = getCachedActiveMembers();
    const skillBadgesPromise = prisma.skillBadge.findMany({ include: { user_skill_badges: true } });

    return (
        <KanBanBoard
            readOnly={!isUserAdmin(loggedInUser)}
            tasksPromise={tasksPromise}
            activeMembersPromise={activeMembersPromise}
            skillBadgesPromise={skillBadgesPromise}
        />
    );
};

export default TasksPage;
