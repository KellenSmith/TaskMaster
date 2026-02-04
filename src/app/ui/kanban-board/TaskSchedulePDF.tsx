import { Document, Page, Text, View } from "@react-pdf/renderer";
import { formatDate } from "../utils";
import { getGroupedAndSortedTasks } from "../../(pages)/calendar-post/event-utils";
import dayjs from "dayjs";
import { styles } from "../pdf-styles";
import { Prisma } from "../../../prisma/generated/browser";

const customStyles = {
    // Add new column-specific styles
    columnTask: {
        width: "35%", // Task name gets more space
        minHeight: 20,
    },
    columnDate: {
        width: "20%", // Start and end times
        minHeight: 20,
    },
    columnAssignee: {
        width: "25%", // Assignee
        minHeight: 20,
    },
};

// Create a PDF document component
const TaskSchedulePDF = ({ event, tasks }: {
    event?: Prisma.EventGetPayload<{}>;
    tasks: Prisma.TaskGetPayload<{
        include: { assignee: { select: { id: true; nickname: true } }; skill_badges: true };
    }>[]
}) => {
    const getTaskRow = (task: Prisma.TaskGetPayload<{
        include: { assignee: { select: { id: true; nickname: true } }; skill_badges: true };
    }>) => (
        <View style={styles.tableRow} key={task.id}>
            <Text wrap={true} style={{ ...styles.tableCell, ...customStyles.columnTask }}>
                {task.name}
            </Text>
            <Text style={{ ...styles.tableCell, ...customStyles.columnDate }}>
                {task.start_time ? formatDate(task.start_time) : ""}
            </Text>
            <Text style={{ ...styles.tableCell, ...customStyles.columnDate }}>
                {formatDate(task.end_time)}
            </Text>
            <Text style={{ ...styles.tableCell, ...customStyles.columnAssignee }}>
                {task.assignee?.nickname}
            </Text>
        </View>
    );

    const getEventDetails = () => (
        event ? <View style={styles.eventDetails}>
            <View style={styles.eventDetailRow}>
                <Text style={styles.eventDetailLabel}>Event:</Text>
                <Text>{event?.title}</Text>
            </View>
            <View style={styles.eventDetailRow}>
                <Text style={styles.eventDetailLabel}>Time:</Text>
                <Text>{`${formatDate(event.start_time)} - ${formatDate(event.end_time)}`}</Text>
            </View>
        </View> : null
    );

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.eventHeader}>Task Schedule</Text>
                <View style={styles.eventDetailRow}>
                    <Text style={styles.eventDetailLabel}>Printed:</Text>
                    <Text>{formatDate(dayjs.utc())}</Text>
                </View>
                {event && getEventDetails()}
                <View style={styles.table}>
                    {/* Table Header */}
                    <View style={[styles.tableRow, styles.headerCell]}>
                        {["Task Name", "Start Time", "End Time", "Assignee"].map((header) => (
                            <Text
                                key={header}
                                wrap={true}
                                style={{
                                    ...styles.tableCell,
                                    ...styles.headerCell,
                                    ...customStyles.columnTask,
                                }}
                            >
                                {header}
                            </Text>
                        ))}
                    </View>
                    {/* Table Body */}
                    {getGroupedAndSortedTasks(tasks).map((taskGroup) => (
                        <View key={taskGroup[0].name} style={styles.taskGroup}>
                            {taskGroup.map((task) => getTaskRow(task))}
                        </View>
                    ))}
                </View>
            </Page>
        </Document>
    );
};

export default TaskSchedulePDF;
