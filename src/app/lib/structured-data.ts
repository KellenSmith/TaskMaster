interface OrganizationSchema {
    "@context": "https://schema.org";
    "@type": "Organization";
    name: string;
    url?: string;
    logo?: string;
    description?: string;
    contactPoint?: {
        "@type": "ContactPoint";
        telephone?: string;
        contactType: "customer service";
        email?: string;
    };
    address?: {
        "@type": "PostalAddress";
        streetAddress?: string;
        addressLocality?: string;
        addressRegion?: string;
        postalCode?: string;
        addressCountry?: string;
    };
}

interface WebApplicationSchema {
    "@context": "https://schema.org";
    "@type": "WebApplication";
    name: string;
    url: string;
    description: string;
    applicationCategory: "BusinessApplication";
    operatingSystem: "Web Browser";
    offers?: {
        "@type": "Offer";
        price: string;
        priceCurrency: string;
    };
}

export function generateOrganizationSchema({
    name,
    url,
    logo,
    description,
    phone,
    email,
    address,
}: {
    name: string;
    url?: string;
    logo?: string;
    description?: string;
    phone?: string;
    email?: string;
    address?: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
    };
}): OrganizationSchema {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name,
        ...(url && { url }),
        ...(logo && { logo }),
        ...(description && { description }),
        ...((phone || email) && {
            contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer service",
                ...(phone && { telephone: phone }),
                ...(email && { email }),
            },
        }),
        ...(address && {
            address: {
                "@type": "PostalAddress",
                ...(address.street && { streetAddress: address.street }),
                ...(address.city && { addressLocality: address.city }),
                ...(address.state && { addressRegion: address.state }),
                ...(address.zip && { postalCode: address.zip }),
                ...(address.country && { addressCountry: address.country }),
            },
        }),
    };
}

export function generateWebApplicationSchema({
    name,
    url,
    description,
    price,
    currency = "USD",
}: {
    name: string;
    url: string;
    description: string;
    price?: string;
    currency?: string;
}): WebApplicationSchema {
    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name,
        url,
        description,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web Browser",
        ...(price && {
            offers: {
                "@type": "Offer",
                price,
                priceCurrency: currency,
            },
        }),
    };
}
