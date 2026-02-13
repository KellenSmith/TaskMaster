export enum PaymentState {
    Paid = "Paid", // eslint-disable-line no-unused-vars
    Failed = "Failed", // eslint-disable-line no-unused-vars
    Cancelled = "Cancelled", // eslint-disable-line no-unused-vars
    Aborted = "Aborted", // eslint-disable-line no-unused-vars
}
export type PaymentStateType = `${PaymentState}`;

export enum TransactionType {
    Authorization = "Authorization", // eslint-disable-line no-unused-vars
    Sale = "Sale", // eslint-disable-line no-unused-vars
}
export type TransactionTypeType = `${TransactionType}`;

type PaymentOperation = {
    method: string;
    href: string;
    rel: string;
    contentType: string;
};

export type SubscriptionToken = {
    type: "unscheduled";
    token: string;
    name: string;
    expiryDate: string; // format: MM/YYYY
};

export type SwedbankPaymentRequestOrderItem = {
    reference: string;
    name: string;
    type: string;
    class: string;
    itemUrl?: string;
    imageUrl?: string;
    description: string;
    discountDescription?: string;
    quantity: number;
    quantityUnit: string;
    unitPrice: number;
    discountPrice: number;
    vatPercent: number;
    amount: number;
    vatAmount: number;
};

export type SwedbankPaymentRequestBody = {
    paymentorder: {
        operation: "Purchase";
        currency: "SEK";
        amount: number;
        vatAmount: number;
        description: string;
        userAgent: string;
        language: string;
        urls: {
            hostUrls: string[];
            completeUrl: string;
            cancelUrl: string;
            callbackUrl: string;
            logoUrl: string | undefined;
            termsOfServiceUrl?: string | null;
        };
        payeeInfo: {
            payeeId: string;
            payeeReference: string; // Compliant: alphanumeric, max 30 chars, unique
            payeeName: string;
            orderReference: string; // Internal order reference (can contain hyphens)
        };
        orderItems: SwedbankPaymentRequestOrderItem[];
    };
};

export type PaymentOrderResponse = {
    paymentOrder: {
        id: string;
        created: string;
        updated: string;
        operation: string;
        status: PaymentStateType;
        currency: string;
        vatAmount: number;
        amount: number;
        description: string;
        initiatingSystemUserAgent: string;
        language: string;
        availableInstruments: string[];
        implementation: string;
        instrumentMode: boolean;
        guestMode: boolean;
        orderItems: { id: string };
        urls: { id: string };
        payeeInfo: { id: string };
        payer: { id: string };
        history: { id: string };
        failed: { id: string };
        aborted: { id: string };
        paid: {
            id: string;
            transactionType: TransactionTypeType;
            tokens: SubscriptionToken[] | undefined;
        };
        cancelled: { id: string };
        reversed: { id: string };
        financialTransactions: { id: string };
        failedAttempts: { id: string };
        postPurchaseFailedAttempts: { id: string };
        metadata: { id: string };
    };
    operations: PaymentOperation[];
};
