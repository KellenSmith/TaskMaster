import ProductsDashboard from "./ProductsDashboard";
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

const ProductsPage = () => {
    const productsPromise = getCachedProducts();

    return <ProductsDashboard productsPromise={productsPromise} />;
};

export default ProductsPage;
