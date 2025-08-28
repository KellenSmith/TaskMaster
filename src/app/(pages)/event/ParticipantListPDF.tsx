import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "../../ui/pdf-styles";
import GlobalConstants from "../../GlobalConstants";
import { formatDate } from "../../ui/utils";
import { FieldLabels } from "../../ui/form/FieldCfg";
import { useMemo } from "react";
import dayjs from "dayjs";
import { Prisma } from "@prisma/client";

interface ParticipantListPDFProps {
    event: Prisma.EventGetPayload<true>;
    eventParticipants: Prisma.EventParticipantGetPayload<{
        include: { user: { select: { id: true; nickname: true } } };
    }>[];
}

const ParticipantListPDF = ({ event, eventParticipants }: ParticipantListPDFProps) => {
    const headers = useMemo(() => [GlobalConstants.NICKNAME, "Arrived"], []);

    const getEventDetails = () => (
        <View key="event" style={styles.eventDetails}>
            <View style={styles.eventDetailRow}>
                <Text style={styles.eventDetailLabel}>Event:</Text>
                <Text>{event.title}</Text>
            </View>
            <View style={styles.eventDetailRow}>
                <Text style={styles.eventDetailLabel}>Time:</Text>
                <Text>{`${formatDate(event.start_time)} - ${formatDate(event.end_time)}`}</Text>
            </View>
        </View>
    );

    const getParticipantRows = () => {
        if (eventParticipants.length < 1) return null;
        return eventParticipants.map(
            (
                participant: Prisma.EventParticipantGetPayload<{
                    include: { user: { select: { id: true; nickname: true } } };
                }>,
            ) => (
                <View style={styles.tableRow} key={participant.user.id}>
                    {headers.map((header) => (
                        <Text
                            key={header}
                            wrap={true}
                            style={{ ...styles.tableCell, ...styles.columnStyle }}
                        >
                            {header === GlobalConstants.NICKNAME ? participant.user.nickname : ""}
                        </Text>
                    ))}
                </View>
            ),
        );
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
