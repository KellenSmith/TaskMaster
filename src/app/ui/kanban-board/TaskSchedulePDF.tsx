import { Document, Page, Text, View } from "@react-pdf/renderer";
import GlobalConstants from "../../GlobalConstants";
import { formatDate } from "../utils";
import { getGroupedAndSortedTasks } from "../../(pages)/calendar-post/event-utils";
import dayjs from "dayjs";
import { styles } from "../pdf-styles";

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
const TaskSchedulePDF = ({ event = null, tasks }) => {
    const getTaskRow = (task) => (
        <View style={styles.tableRow} key={task[GlobalConstants.ID]}>
            <Text wrap={true} style={{ ...styles.tableCell, ...customStyles.columnTask }}>
                {task[GlobalConstants.NAME]}
            </Text>
            <Text style={{ ...styles.tableCell, ...customStyles.columnDate }}>
                {formatDate(task[GlobalConstants.START_TIME])}
            </Text>
            <Text style={{ ...styles.tableCell, ...customStyles.columnDate }}>
                {formatDate(task[GlobalConstants.END_TIME])}
            </Text>
            <Text style={{ ...styles.tableCell, ...customStyles.columnAssignee }}>
                {task.assignee?.nickname}
            </Text>
        </View>
    );

    const getEventDetails = () => (
        <View style={styles.eventDetails}>
            <View style={styles.eventDetailRow}>
                <Text style={styles.eventDetailLabel}>Event:</Text>
                <Text>{event[GlobalConstants.TITLE]}</Text>
            </View>
            <View style={styles.eventDetailRow}>
                <Text style={styles.eventDetailLabel}>Time:</Text>
                <Text>{`${formatDate(event[GlobalConstants.START_TIME])} - ${formatDate(event[GlobalConstants.END_TIME])}`}</Text>
            </View>
        </View>
    );

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.eventHeader}>Task Schedule</Text>
                <View style={styles.eventDetailRow}>
                    <Text style={styles.eventDetailLabel}>Printed:</Text>
                    <Text>{formatDate(dayjs())}</Text>
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
                        <View key={taskGroup[0][GlobalConstants.NAME]} style={styles.taskGroup}>
                            {taskGroup.map((task) => getTaskRow(task))}
                        </View>
                    ))}
                </View>
            </Page>
        </Document>
    );
};

export default TaskSchedulePDF;
