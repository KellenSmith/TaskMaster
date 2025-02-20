import { ZodSchema } from "zod";

export const getStrippedFormData = (formData: FormData, zodSchema?: ZodSchema): any => {
    const strippedFormData = Object.fromEntries(formData.entries().filter(([_, value]) => !!value)); // eslint-disable-line no-unused-vars
    if (zodSchema) return zodSchema.parse(strippedFormData);
    return strippedFormData;
};
