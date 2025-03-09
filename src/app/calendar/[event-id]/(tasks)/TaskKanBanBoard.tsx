"use client";

import React, { useCallback, useEffect, useState } from "react";
import GlobalConstants from "../../../GlobalConstants";
import { getEventTasks } from "../../../lib/task-actions";
import { defaultActionState as defaultDatagridActionState } from "../../../ui/Datagrid";
import KanBanBoard from "../../../ui/KanBanBoard";
import { isUserHost } from "../../../lib/definitions";
import { useUserContext } from "../../../context/UserContext";

const TaskKanBanBoard = ({ event }) => {
    const { user } = useUserContext();
    const [tasks, setTasks] = useState([]);

    const fetchDbTasks = useCallback(async () => {
        const fetchedEventTasks = await getEventTasks(
            { eventId: event[GlobalConstants.ID] },
            defaultDatagridActionState,
        );
        setTasks(fetchedEventTasks.result);
    }, [event]);

    useEffect(() => {
        if (event) {
            fetchDbTasks();
        }
    }, [event, fetchDbTasks]);

    return (
        <>
            <KanBanBoard
                tasks={tasks}
                fetchDbTasks={fetchDbTasks}
                readOnly={!isUserHost(user, event)}
            />
        </>
    );
};

export default TaskKanBanBoard;
