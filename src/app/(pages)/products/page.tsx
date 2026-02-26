import ProductsDashboard from "./ProductsDashboard";
// ...existing code...
import { prisma } from "../../../prisma/prisma-client";

const ProductsPage = () => {
    const productsPromise = prisma.product.findMany({
        where: {
            ticket: null,
        },
        include: {
            membership: true,
        },
    });

    return <ProductsDashboard productsPromise={productsPromise} />;
};

export default ProductsPage;
