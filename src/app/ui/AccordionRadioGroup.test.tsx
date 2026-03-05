import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccordionRadioGroup from "./AccordionRadioGroup";

describe("AccordionRadioGroup", () => {
    const valueOptions = {
        first: "Option A",
        second: "Option B",
        third: "Option C",
    };

    const renderAccordionRadioGroup = (overrides?: {
        title?: string;
        value?: string;
        setValue?: (value: string) => void;
        valueOptions?: { [key: string]: string };
    }) => {
        const setValue = vi.fn();

        render(
            <AccordionRadioGroup
                title={overrides?.title ?? "Choose an option"}
                value={overrides?.value ?? "Option B"}
                setValue={overrides?.setValue ?? setValue}
                valueOptions={overrides?.valueOptions ?? valueOptions}
            />,
        );

        return { setValue };
    };

    it("renders title and all radio options", () => {
        renderAccordionRadioGroup();

        expect(screen.getByText("Choose an option")).toBeInTheDocument();
        expect(screen.getByRole("radio", { name: "Option A" })).toBeInTheDocument();
        expect(screen.getByRole("radio", { name: "Option B" })).toBeInTheDocument();
        expect(screen.getByRole("radio", { name: "Option C" })).toBeInTheDocument();
    });

    it("marks the provided value as selected", () => {
        renderAccordionRadioGroup({ value: "Option B" });

        expect(screen.getByRole("radio", { name: "Option B" })).toBeChecked();
        expect(screen.getByRole("radio", { name: "Option A" })).not.toBeChecked();
        expect(screen.getByRole("radio", { name: "Option C" })).not.toBeChecked();
    });

    it("calls setValue with chosen option when selection changes", async () => {
        const { setValue } = renderAccordionRadioGroup({ value: "Option A" });

        await userEvent.click(screen.getByRole("radio", { name: "Option C" }));

        expect(setValue).toHaveBeenCalledTimes(1);
        expect(setValue).toHaveBeenCalledWith("Option C");
    });

    it("supports single-option groups", () => {
        renderAccordionRadioGroup({
            value: "Only option",
            valueOptions: { only: "Only option" },
        });

        expect(screen.getAllByRole("radio")).toHaveLength(1);
        expect(screen.getByRole("radio", { name: "Only option" })).toBeChecked();
    });

    it("renders no radios when valueOptions is empty", () => {
        renderAccordionRadioGroup({ value: "", valueOptions: {} });

        expect(screen.queryAllByRole("radio")).toHaveLength(0);
    });
});
