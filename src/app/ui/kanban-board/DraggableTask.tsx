import { Card, Stack, Typography } from "@mui/material";
import { formatDate } from "../utils";
import GlobalConstants from "../../GlobalConstants";

const DraggableTask = ({ task, setDraggedTask, setViewTask }) => {
    return (
        <Card
            draggable
            onDragStart={() => setDraggedTask(task)}
            sx={{
                padding: 2,
                cursor: "pointer",
            }}
            onClick={(e) => {
                e.stopPropagation();
                setViewTask(task);
            }}
        >
            <Typography variant="body1">{task[GlobalConstants.NAME]}</Typography>
            <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">
                    {formatDate(task[GlobalConstants.START_TIME])}
                </Typography>
                {"-"}
                <Typography variant="body2">
                    {formatDate(task[GlobalConstants.END_TIME])}
                </Typography>
            </Stack>
        </Card>
    );
};

export default DraggableTask;
