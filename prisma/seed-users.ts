import { pathToFileURL } from "url";
import { prisma } from "./prisma-client";
import {
    seedMemberships,
    seedProducts,
    seedUserCredentials,
    seedUserMemberships,
    seedUsers,
} from "./seed";

async function main() {
    console.log("Starting seed");
    await seedUsers();
    await seedUserCredentials();
    await seedProducts();
    await seedMemberships();
    await seedUserMemberships();
    console.log("Done seeding");
}

// Run main only when this file is executed directly (ESM)
if (
    typeof process !== "undefined" &&
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    main()
        .catch((e) => {
            console.error(e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
