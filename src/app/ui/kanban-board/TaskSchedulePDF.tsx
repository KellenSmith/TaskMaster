import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import GlobalConstants from "../../GlobalConstants";
import { formatDate } from "../utils";
import { sortGroupedTasks } from "../../(pages)/calendar/[event-id]/event-utils";
import { blueGrey } from "@mui/material/colors";
import dayjs from "dayjs";

// Define styles for the PDF document
const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontSize: 10,
    },
    table: {
        width: "auto",
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#ddd",
    },
    tableRow: {
        flexDirection: "row",
    },
    taskGroup: {
        borderTop: 2,
        borderBottom: 2,
        borderStyle: "solid",
        borderColor: "#999",
        paddingTop: 2,
        paddingBottom: 2,
        marginBottom: 5,
    },
    tableCell: {
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 5,
        textAlign: "center",
        maxWidth: "100%",
        flexShrink: 1,
        flexGrow: 0,
    },
    headerCell: {
        fontWeight: "bold",
        backgroundColor: blueGrey[600],
    },
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
    eventHeader: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    eventDetails: {
        marginBottom: 15,
    },
    eventDetailRow: {
        flexDirection: "row",
        marginBottom: 5,
        fontSize: 12,
    },
    eventDetailLabel: {
        fontWeight: "bold",
        width: 100,
    },
});

// Create a PDF document component
const TaskSchedulePDF = ({ event = null, tasks }) => {
    const getTaskRow = (task) => (
        <View style={styles.tableRow} key={task[GlobalConstants.ID]}>
            <Text wrap={true} style={{ ...styles.tableCell, ...styles.columnTask }}>
                {task[GlobalConstants.NAME]}
            </Text>
            <Text style={{ ...styles.tableCell, ...styles.columnDate }}>
                {formatDate(task[GlobalConstants.START_TIME])}
            </Text>
            <Text style={{ ...styles.tableCell, ...styles.columnDate }}>
                {formatDate(task[GlobalConstants.END_TIME])}
            </Text>
            <Text style={{ ...styles.tableCell, ...styles.columnAssignee }}>
                {task[GlobalConstants.ASSIGNEE_ID]}
            </Text>
        </View>
    );

    const getSortedTaskComps = () => {
        if (tasks.length < 1) return [];
        const uniqueTaskNames = [...new Set(tasks.map((task) => task[GlobalConstants.NAME]))];
        const sortedTasksGroupedByName = sortGroupedTasks(
            uniqueTaskNames.map((taskName) =>
                tasks.filter((task) => task[GlobalConstants.NAME] === taskName),
            ),
        );
        return sortedTasksGroupedByName.map((taskGroup) => (
            <View key={taskGroup[0][GlobalConstants.NAME]} style={styles.taskGroup}>
                {taskGroup.map((task) => getTaskRow(task))}
            </View>
        ));
    };

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
                        <Text
                            wrap={true}
                            style={{
                                ...styles.tableCell,
                                ...styles.headerCell,
                                ...styles.columnTask,
                            }}
                        >
                            Task Name
                        </Text>
                        <Text
                            style={{
                                ...styles.tableCell,
                                ...styles.headerCell,
                                ...styles.columnDate,
                            }}
                        >
                            Start Time
                        </Text>
                        <Text
                            style={{
                                ...styles.tableCell,
                                ...styles.headerCell,
                                ...styles.columnDate,
                            }}
                        >
                            End Time
                        </Text>
                        <Text
                            style={{
                                ...styles.tableCell,
                                ...styles.headerCell,
                                ...styles.columnAssignee,
                            }}
                        >
                            Assignee
                        </Text>
                    </View>
                    {/* Table Body */}
                    {getSortedTaskComps()}
                </View>
            </Page>
        </Document>
    );
};

export default TaskSchedulePDF;
