export const buildFormData = (entries: Record<string, string>) => {
    const formData = new FormData();
    Object.entries(entries).forEach(([key, value]) => {
        formData.set(key, value);
    });
    return formData;
};
