import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import ShopDashboard from "./ShopDashboard";
import { prisma } from "../../../../prisma/prisma-client";

const ShopPage = () => {
    const productsPromise = prisma.product.findMany({
        where: {
            ticket: null,
        },
        include: {
            membership: true,
        },
    });
    return (
        <ErrorBoundarySuspense>
            <ShopDashboard productsPromise={productsPromise} />
        </ErrorBoundarySuspense>
    );
};

export default ShopPage;
