import ShopDashboard from "./ShopDashboard";
import { prisma } from "../../../prisma/prisma-client";
import { cacheTag } from "next/cache";
import GlobalConstants from "../../GlobalConstants";

const getCachedProducts = async () => {
    "use cache";
    cacheTag(GlobalConstants.PRODUCT);

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
