import { StyleSheet } from "@react-pdf/renderer";
import { blueGrey } from "@mui/material/colors";

export const styles = StyleSheet.create({
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
    columnStyle: {
        width: "100%",
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
