import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "../../../ui/pdf-styles";
import GlobalConstants from "../../../GlobalConstants";
import { formatDate } from "../../../ui/utils";
import { FieldLabels } from "../../../ui/form/FieldCfg";
import { useMemo } from "react";
import dayjs from "dayjs";

const ParticipantListPDF = ({ event }) => {
    const headers = useMemo(() => [GlobalConstants.NICKNAME, GlobalConstants.EMAIL, "Arrived"], []);

    const getEventDetails = () => (
        <View key="event" style={styles.eventDetails}>
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

    const getParticipantRows = () => {
        if (event[GlobalConstants.PARTICIPANT_USERS].length < 1) return null;
        return event[GlobalConstants.PARTICIPANT_USERS].map((participant) => (
            <View style={styles.tableRow} key={participant.User[GlobalConstants.ID]}>
                {headers.map((header) => (
                    <Text
                        key={header}
                        wrap={true}
                        style={{ ...styles.tableCell, ...styles.columnStyle }}
                    >
                        {participant.User[header]}
                    </Text>
                ))}
            </View>
        ));
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.eventHeader}>Participant list</Text>
                <View style={styles.eventDetailRow}>
                    <Text style={styles.eventDetailLabel}>Printed:</Text>
                    <Text>{formatDate(dayjs())}</Text>
                </View>
                {event && getEventDetails()}
                <View style={styles.table}>
                    {/* Table Header */}
                    <View style={[styles.tableRow, styles.headerCell]}>
                        {headers.map((header) => (
                            <Text
                                key={header}
                                wrap={true}
                                style={{
                                    ...styles.tableCell,
                                    ...styles.headerCell,
                                    ...styles.columnStyle,
                                }}
                            >
                                {FieldLabels[header] || header}
                            </Text>
                        ))}
                    </View>
                    {/* Table Body */}
                    {getParticipantRows()}
                </View>
            </Page>
        </Document>
    );
};

export default ParticipantListPDF;
