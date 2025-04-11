import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import GlobalConstants from "../../GlobalConstants";
import { formatDate } from "../utils";

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
    tableCell: {
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 5,
        textAlign: "center",
        flexGrow: 1,
    },
    headerCell: {
        fontWeight: "bold",
        backgroundColor: "#f0f0f0",
    },
});

// Create a PDF document component
const TaskSchedulePDF = ({ tasks }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.table}>
                {/* Table Header */}
                <View style={[styles.tableRow, styles.headerCell]}>
                    <Text style={{ ...styles.tableCell, ...styles.headerCell }}>Task Name</Text>
                    <Text style={{ ...styles.tableCell, ...styles.headerCell }}>Start Time</Text>
                    <Text style={{ ...styles.tableCell, ...styles.headerCell }}>End Time</Text>
                    <Text style={{ ...styles.tableCell, ...styles.headerCell }}>Assignee</Text>
                </View>
                {/* Table Body */}
                {tasks.map((task) => (
                    <View style={styles.tableRow} key={task[GlobalConstants.ID]}>
                        <Text style={styles.tableCell}>{task[GlobalConstants.NAME]}</Text>
                        <Text style={styles.tableCell}>
                            {formatDate(task[GlobalConstants.START_TIME])}
                        </Text>
                        <Text style={styles.tableCell}>
                            {formatDate(task[GlobalConstants.END_TIME])}
                        </Text>
                        <Text style={styles.tableCell}>{task[GlobalConstants.ASSIGNEE_ID]}</Text>
                    </View>
                ))}
            </View>
        </Page>
    </Document>
);

export default TaskSchedulePDF;
