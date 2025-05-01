import axios from "axios";

const postPaymentOrder = async (amount: number, description: string, userAgent: string) => {
    const requestBody = {
        paymentorder: {
            operation: "Purchase",
            currency: "SEK",
            amount: amount,
            vatAmount: 0,
            description: description,
            userAgent: userAgent,
            language: "en-US",
            urls: {
                hostUrls: [process.env.NEXT_PUBLIC_API_URL],
                paymentUrl: "https://example.com/perform-payment", //Seamless View only
                completeUrl: "https://example.com/payment-completed",
                cancelUrl: "https://example.com/payment-cancelled", //Redirect only
                callbackUrl: "https://api.example.com/payment-callback",
                logoUrl: "https://example.com/logo.png",
                termsOfServiceUrl: "https://example.com/termsandconditoons.pdf",
            },
            payeeInfo: {
                payeeId: "5cabf558-5283-482f-b252-4d58e06f6f3b",
                payeeReference: "AB832",
                payeeName: "Merchant1",
                orderReference: "or-123456",
            },
        },
    };

    const headers = {
        "Content-Type": "application/json;version=3.1",
        Authorization: `Bearer ${process.env.SWEDBANK_PAY_TOKEN}`,
    };

    const response = await axios.post(`${process.env.SWEDBANK_PAY_BASE_URL}`, requestBody, {
        headers,
    });
};

const getPaymentOrder = async () => {
    const headers = { Accept: "application/json;version=3.1" };
};
