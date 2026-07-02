import ProductsDashboard from "./ProductsDashboard";
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

const ProductsPage = () => {
    const productsPromise = getCachedProducts();

    return (
        <ProtectedPage name={GlobalConstants.PRODUCTS}>
            <ProductsDashboard productsPromise={productsPromise} />
        </ProtectedPage>
    );
};

export default ProductsPage;
