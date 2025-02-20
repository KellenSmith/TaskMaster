import { Paper, Tooltip, useTheme } from "@mui/material";
import dayjs from "dayjs";
import { FC } from "react";

export interface ICalendarEvent {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    color?: string;
}

export interface CalendarEventProps {
    event: ICalendarEvent;
}

const CalendarEvent: FC<CalendarEventProps> = ({ event }) => {
    const theme = useTheme();

    return (
        <Tooltip
            title={`${dayjs(event.startTime).format("L HH:mm")} - ${dayjs(event.endTime).format("L HH:mm")}`}
        >
            <Paper
                elevation={0}
                sx={{
                    backgroundColor: event.color || theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    padding: "2px 4px",
                    borderRadius: 1,
                    fontSize: "0.75rem",
                    mb: 0.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                }}
            >
                {event.title}
            </Paper>
        </Tooltip>
    );
};

export default CalendarEvent;
