// ...existing code...
import ShopDashboard from "./ShopDashboard";
import { prisma } from "../../../prisma/prisma-client";

const ShopPage = () => {
    const productsPromise = prisma.product.findMany({
        where: {
            ticket: null,
        },
        include: {
            membership: true,
        },
    });
    return <ShopDashboard productsPromise={productsPromise} />;
};

export default ShopPage;
