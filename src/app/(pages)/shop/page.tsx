import ShopDashboard from "./ShopDashboard";
import { prisma } from "../../../prisma/prisma-client";

const getCachedProducts = async () => {
    return await prisma.product.findMany({
        where: {
            ticket: null,
        },
        include: {
            membership: true,
        },
    });
};

const ShopPage = () => {
    const productsPromise = getCachedProducts();
    return <ShopDashboard productsPromise={productsPromise} />;
};

export default ShopPage;
