import { Document, Page, Text, View } from "@react-pdf/renderer";
import { styles } from "../../ui/pdf-styles";
import { formatDate, formatPrice } from "../../ui/utils";
import { useMemo } from "react";
import dayjs from "dayjs";
import { Language, Prisma } from "@prisma/client";
import LanguageTranslations from "./LanguageTranslations";

interface OrdersReportPDFProps {
    orders: Prisma.OrderGetPayload<{
        include: {
            order_items: {
                include: {
                    product: true;
                };
            };
        };
    }>[];
    language: Language;
    startDate?: Date | dayjs.Dayjs;
    endDate?: Date | dayjs.Dayjs;
}

const OrdersReportPDF = ({ orders, language, startDate, endDate }: OrdersReportPDFProps) => {
    const headers = useMemo(
        () => [
            LanguageTranslations.product[language],
            LanguageTranslations.quantity[language],
            LanguageTranslations.unitPrice[language],
            LanguageTranslations.vatPerUnit[language],
            LanguageTranslations.totalPrice[language],
            LanguageTranslations.totalVat[language],
        ],
        [language],
    );

    // Aggregate products from all orders
    const productSummary = useMemo(() => {
        const summary: {
            [productId: string]: {
                name: string;
                quantity: number;
                unitPrice: number;
                unitVat: number;
                totalPrice: number;
                totalVat: number;
            };
        } = {};

        orders.forEach((order) => {
            order.order_items.forEach((item) => {
                if (!summary[item.product_id]) {
                    summary[item.product_id] = {
                        name: item.product.name,
                        quantity: 0,
                        unitPrice: item.price,
                        unitVat: item.vat_amount,
                        totalPrice: 0,
                        totalVat: 0,
                    };
                }

                summary[item.product_id].quantity += item.quantity;
                summary[item.product_id].totalPrice += item.price * item.quantity;
                summary[item.product_id].totalVat += item.vat_amount * item.quantity;
            });
        });

        return Object.values(summary);
    }, [orders]);

    // Calculate grand totals
    const grandTotals = useMemo(() => {
        return productSummary.reduce(
            (acc, item) => ({
                totalPrice: acc.totalPrice + item.totalPrice,
                totalVat: acc.totalVat + item.totalVat,
            }),
            { totalPrice: 0, totalVat: 0 },
        );
    }, [productSummary]);


    const getReportDetails = () => (
        <View key="report-details" style={styles.eventDetails}>
            <View style={styles.eventDetailRow}>
                <Text style={styles.eventDetailLabel}>
                    {LanguageTranslations.reportPeriod[language]}
                </Text>
                <Text>
                    {startDate && endDate
                        ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                        : LanguageTranslations.allOrders[language]}
                </Text>
            </View>
            <View style={styles.eventDetailRow}>
                <Text style={styles.eventDetailLabel}>
                    {LanguageTranslations.totalOrders[language]}
                </Text>
                <Text>{orders.length}</Text>
            </View>
        </View>
    );

    const getProductRows = () => {
        if (productSummary.length < 1) {
            return (
                <View style={styles.tableRow}>
                    <Text style={styles.tableCell}>
                        {LanguageTranslations.noProductsFound[language]}
                    </Text>
                </View>
            );
        }

        return productSummary.map((item, index) => (
            <View style={styles.tableRow} key={index}>
                <Text style={{ ...styles.tableCell, width: "30%" }}>{item.name}</Text>
                <Text style={{ ...styles.tableCell, width: "10%" }}>{item.quantity}</Text>
                <Text style={{ ...styles.tableCell, width: "15%" }}>
                    {formatPrice(item.unitPrice)}
                </Text>
                <Text style={{ ...styles.tableCell, width: "15%" }}>
                    {formatPrice(item.unitVat)}
                </Text>
                <Text style={{ ...styles.tableCell, width: "15%" }}>
                    {formatPrice(item.totalPrice)}
                </Text>
                <Text style={{ ...styles.tableCell, width: "15%" }}>
                    {formatPrice(item.totalVat)}
                </Text>
            </View>
        ));
    };

    const getTotalsRow = () => (
        <View style={[styles.tableRow, { backgroundColor: "#f0f0f0", fontWeight: "bold" }]}>
            <Text style={{ ...styles.tableCell, width: "30%", fontWeight: "bold" }}>
                {LanguageTranslations.total[language]}
            </Text>
            <Text style={{ ...styles.tableCell, width: "10%" }}></Text>
            <Text style={{ ...styles.tableCell, width: "15%" }}></Text>
            <Text style={{ ...styles.tableCell, width: "15%" }}></Text>
            <Text style={{ ...styles.tableCell, width: "15%", fontWeight: "bold" }}>
                {formatPrice(grandTotals.totalPrice)}
            </Text>
            <Text style={{ ...styles.tableCell, width: "15%", fontWeight: "bold" }}>
                {formatPrice(grandTotals.totalVat)}
            </Text>
        </View>
    );

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <Text style={styles.eventHeader}>
                    {LanguageTranslations.ordersReport[language]}
                </Text>
                <View style={styles.eventDetailRow}>
                    <Text style={styles.eventDetailLabel}>
                        {LanguageTranslations.printed[language]}
                    </Text>
                    <Text>{formatDate(dayjs.utc())}</Text>
                </View>
                {getReportDetails()}
                <View style={styles.table}>
                    {/* Table Header */}
                    <View style={[styles.tableRow, styles.headerCell]}>
                        {headers.map((header, index) => (
                            <Text
                                key={header}
                                style={{
                                    ...styles.tableCell,
                                    ...styles.headerCell,
                                    width:
                                        index === 0
                                            ? "30%"
                                            : index === 1
                                                ? "10%"
                                                : "15%",
                                }}
                            >
                                {header}
                            </Text>
                        ))}
                    </View>
                    {/* Table Body */}
                    {getProductRows()}
                    {/* Totals Row */}
                    {productSummary.length > 0 && getTotalsRow()}
                </View>
            </Page>
        </Document>
    );
};

export default OrdersReportPDF;
