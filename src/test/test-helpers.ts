import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

export const buildFormData = (entries: Record<string, string>) => {
    const formData = new FormData();
    Object.entries(entries).forEach(([key, value]) => {
        formData.set(key, value);
    });
    return formData;
};

export const selectAutocompleteOption = async (fieldLabel: string, optionName: string) => {
    const fieldComp = screen.getByRole("combobox", { name: fieldLabel });
    await userEvent.click(fieldComp);
    const option = within(await screen.findByRole("listbox")).getByRole("option", {
        name: optionName,
    });
    await userEvent.click(option);
};
