import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import KanBanBoard from "../../ui/kanban-board/KanBanBoard";
import { getActiveMembers, getLoggedInUser } from "../../lib/user-actions";
import { isUserAdmin } from "../../lib/utils";
import { prisma } from "../../../prisma/prisma-client";

const TasksPage = async () => {
    const loggedInUser = await getLoggedInUser();
    const tasksPromise = prisma.task.findMany({
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
    const activeMembersPromise = getActiveMembers();
    const skillBadgesPromise = prisma.skillBadge.findMany({ include: { user_skill_badges: true } });

    return (
        <ErrorBoundarySuspense>
            <KanBanBoard
                readOnly={!isUserAdmin(loggedInUser)}
                tasksPromise={tasksPromise}
                activeMembersPromise={activeMembersPromise}
                skillBadgesPromise={skillBadgesPromise}
            />
        </ErrorBoundarySuspense>
    );
};

export default TasksPage;
