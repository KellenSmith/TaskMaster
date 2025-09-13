import { Button, Card, Stack, Typography } from "@mui/material";
import { formatDate, openResourceInNewTab } from "../utils";
import GlobalConstants from "../../GlobalConstants";
import { use, useMemo } from "react";
import { useUserContext } from "../../context/UserContext";
import { Prisma } from "@prisma/client";
import LanguageTranslations from "./LanguageTranslations";
import { getRelativeUrl } from "../../lib/utils";
import { Info, OpenInNew } from "@mui/icons-material";
import isBetween from "dayjs/plugin/isBetween";
import dayjs from "dayjs";
import BookTaskButton from "./BookTaskButton";

dayjs.extend(isBetween);

interface DraggableTaskProps {
    readOnly: boolean;
    eventPromise?: Promise<
        Prisma.EventGetPayload<{
            include: { tickets: { include: { event_participants: true } } };
        }>
    >;
    task: Prisma.TaskGetPayload<{
        include: {
            assignee: { select: { id: true; nickname: true } };
            skill_badges: true;
        };
    }>;
    setDraggedTask?: (
        // eslint-disable-next-line no-unused-vars
        task: Prisma.TaskGetPayload<{
            include: { assignee: { select: { id: true; nickname: true } } };
        }> | null,
    ) => void;
}

const DraggableTask = ({ readOnly, eventPromise, task, setDraggedTask }: DraggableTaskProps) => {
    const { language, user } = useUserContext();
    const event = eventPromise ? use(eventPromise) : null;

    const isReadOnly = useMemo(
        () => () => {
            if (user && task.assignee_id === user.id) return false;
            if (user && task.reviewer_id === user.id) return false;
            return readOnly;
        },
        [readOnly, task, user],
    );

    // TODO: Make randos unable to drag and drop unless assigned or reviewer

    return (
        <>
            <Card
                draggable={!isReadOnly}
                onDragStart={() => setDraggedTask(task)}
                sx={{
                    padding: { xs: 1, sm: 2 },
                    ...(isReadOnly ? {} : { cursor: "grab" }),
                    transition: "transform 0.12s ease, box-shadow 0.12s ease, filter 0.12s ease",
                    "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        filter: "brightness(1.06)",
                    },
                }}
            >
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    flexWrap="wrap"
                    width="100%"
                    gap={1}
                    justifyContent="space-between"
                    alignItems={{ xs: "stretch", sm: "center" }}
                >
                    <Stack flexWrap="wrap" sx={{ width: { xs: "100%", sm: "auto" } }}>
                        <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
                            {task.name}
                        </Typography>
                        <Stack
                            flexWrap="wrap"
                            direction="row"
                            alignItems="center"
                            gap={2}
                            sx={{ mt: 0.5 }}
                        >
                            <Typography variant="body2">{formatDate(task.start_time)}</Typography>
                            <Typography variant="body2">-</Typography>
                            <Typography variant="body2">{formatDate(task.end_time)}</Typography>
                        </Stack>
                    </Stack>

                    <Stack spacing={1} width="100%">
                        <Button
                            variant="outlined"
                            fullWidth
                            color="info"
                            startIcon={<Info />}
                            endIcon={<OpenInNew />}
                            onClick={() =>
                                openResourceInNewTab(
                                    getRelativeUrl([GlobalConstants.TASK], {
                                        [GlobalConstants.TASK_ID]: task.id,
                                    }),
                                )
                            }
                            sx={{ width: { xs: "100%", sm: "auto" } }}
                        >
                            {LanguageTranslations.moreInfo[language]}
                        </Button>
                        <BookTaskButton task={task} event={event} />
                    </Stack>
                </Stack>
            </Card>
        </>
    );
};

export default DraggableTask;
