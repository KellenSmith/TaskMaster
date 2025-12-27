import ProductsDashboard from "./ProductsDashboard";
import ErrorBoundarySuspense from "../../ui/ErrorBoundarySuspense";
import { prisma } from "../../../../prisma/prisma-client";

const ProductsPage = () => {
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
            <ProductsDashboard productsPromise={productsPromise} />
        </ErrorBoundarySuspense>
    );
};

export default ProductsPage;
