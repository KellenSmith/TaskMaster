import ShopDashboard from "./ShopDashboard";
import { prisma } from "../../../prisma/prisma-client";
import ProtectedPage from "../../ProtectedPage";
import GlobalConstants from "../../GlobalConstants";

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
    return (
        <ProtectedPage name={GlobalConstants.SHOP}>
            <ShopDashboard productsPromise={productsPromise} />
        </ProtectedPage>
    );
};

export default ShopPage;
