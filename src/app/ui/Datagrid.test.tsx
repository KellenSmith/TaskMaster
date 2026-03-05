import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Datagrid, { ImplementedDatagridEntities } from "./Datagrid";
import NotificationContextProvider from "../context/NotificationContext";
import { useUserContext } from "../context/UserContext";
import GlobalConstants from "../GlobalConstants";
import { Language } from "../../prisma/generated/enums";

const toFulfilledThenable = <T,>(value: T) =>
    ({
        status: "fulfilled",
        value,
        then: (onFulfilled?: (resolved: T) => unknown) => Promise.resolve(onFulfilled?.(value)),
    }) as unknown as Promise<T>;

const productRows = [
    {
        id: "product-1",
        name: "Product Alpha",
        price: 1234,
        vat_percentage: 25,
        stock: 10,
        description: "Alpha description",
        image_url: "",
    },
    {
        id: "product-2",
        name: "Product Beta",
        price: 999,
        vat_percentage: 12,
        stock: 4,
        description: "Beta description",
        image_url: "",
    },
] as any as ImplementedDatagridEntities[];

const renderDatagrid = (props: Partial<React.ComponentProps<typeof Datagrid>> = {}) => {
    return render(
        <NotificationContextProvider>
            <Datagrid
                name={GlobalConstants.PRODUCT}
                dataGridRowsPromise={toFulfilledThenable(productRows)}
                {...props}
            />
        </NotificationContextProvider>,
    );
};

describe("Datagrid", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({
            language: Language.english,
        } as any);
    });

    it("renders the DataGrid with row data", async () => {
        renderDatagrid();

        expect(await screen.findByText("Product Alpha")).toBeInTheDocument();
        expect(screen.getByRole("grid")).toHaveAttribute("aria-rowcount", "3");
    });

    it("calls custom onRowClick when provided", async () => {
        const onRowClick = vi.fn();
        renderDatagrid({ onRowClick });

        await userEvent.click(await screen.findByRole("gridcell", { name: "Product Alpha" }));

        expect(onRowClick).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("opens edit dialog on row click when updateAction is provided", async () => {
        const updateAction = vi.fn().mockResolvedValue(undefined);
        renderDatagrid({ updateAction });

        await userEvent.click(await screen.findByRole("gridcell", { name: "Product Alpha" }));

        expect(await screen.findByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

        fireEvent.submit(document.querySelector("form") as HTMLFormElement);

        await waitFor(() => {
            expect(updateAction).toHaveBeenCalledTimes(1);
        });
        expect(updateAction).toHaveBeenCalledWith("product-1", expect.any(FormData));
    });

    it("supports creating a new row using the real form", async () => {
        const createAction = vi.fn().mockResolvedValue(undefined);
        renderDatagrid({ createAction });

        await userEvent.click(await screen.findByRole("button", { name: "Add New" }));

        const editButton = screen
            .getAllByRole("button")
            .find((button) => button.querySelector("svg[data-testid='EditIcon']"));
        expect(editButton).toBeDefined();
        await userEvent.click(editButton!);

        await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "New Product");
        await userEvent.type(screen.getByRole("textbox", { name: "Price" }), "25");
        await userEvent.type(screen.getByRole("textbox", { name: "VAT %" }), "25");

        fireEvent.submit(document.querySelector("form") as HTMLFormElement);

        await waitFor(() => {
            expect(createAction).toHaveBeenCalledTimes(1);
        });
    });

    it("renders and executes filtered rows action", async () => {
        const filteredAction = vi.fn().mockResolvedValue(undefined);

        renderDatagrid({
            filteredRowsActions: [{ action: filteredAction, buttonLabel: "Export visible" }],
        });

        await userEvent.click(await screen.findByRole("button", { name: "Export visible" }));

        expect(filteredAction).toHaveBeenCalledTimes(1);
        expect(filteredAction.mock.calls[0][0]).toHaveLength(2);
    });

    it("handles row action success and shows notification", async () => {
        const serverAction = vi.fn().mockResolvedValue("Action completed");
        renderDatagrid({
            updateAction: vi.fn().mockResolvedValue(undefined),
            rowActions: [
                {
                    name: "run-action",
                    serverAction,
                    available: () => true,
                    buttonLabel: "Run Action",
                },
            ],
        });

        await userEvent.click(await screen.findByRole("gridcell", { name: "Product Alpha" }));
        await userEvent.click(screen.getByRole("button", { name: "Run Action" }));

        await waitFor(() => {
            expect(serverAction).toHaveBeenCalledTimes(1);
        });
        expect(await screen.findByText("Action completed")).toBeInTheDocument();
    });

    it("uses confirmation flow for error-colored row actions", async () => {
        const serverAction = vi.fn().mockResolvedValue("Deleted");
        renderDatagrid({
            updateAction: vi.fn().mockResolvedValue(undefined),
            rowActions: [
                {
                    name: "delete-row",
                    serverAction,
                    available: () => true,
                    buttonColor: "error",
                    buttonLabel: "Delete Row",
                },
            ],
        });

        await userEvent.click(await screen.findByRole("gridcell", { name: "Product Alpha" }));
        await userEvent.click(screen.getByRole("button", { name: "Delete Row" }));
        await userEvent.click(await screen.findByRole("button", { name: "Proceed" }));

        await waitFor(() => {
            expect(serverAction).toHaveBeenCalledTimes(1);
        });
        expect(await screen.findByText("Deleted")).toBeInTheDocument();
    });
});
