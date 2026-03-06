import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import KanBanBoardMenu from "./KanBanBoardMenu";
import NotificationContextProvider from "../../context/NotificationContext";
import { useUserContext } from "../../context/UserContext";
import { Language, TaskStatus } from "../../../prisma/generated/enums";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { pdf } from "@react-pdf/renderer";
import { openResourceInNewTab } from "../utils";

vi.mock("./DraggableTaskShifts", () => ({
    __esModule: true,
    default: ({ taskList }: { taskList: Array<{ id: string }> }) => (
        <div data-testid="draggable-task-shifts">{taskList.length}</div>
    ),
}));

vi.mock("./TaskSchedulePDF", () => ({
    __esModule: true,
    default: () => <div data-testid="task-schedule-pdf" />,
}));

vi.mock("@react-pdf/renderer", () => ({
    pdf: vi.fn(() => ({
        toBlob: vi.fn().mockResolvedValue(new Blob(["pdf"], { type: "application/pdf" })),
    })),
}));

vi.mock("../utils", async (importOriginal) => {
    const actual = (await importOriginal()) as object;
    return {
        ...actual,
        openResourceInNewTab: vi.fn(),
    };
});

const makeTask = (overrides: Record<string, unknown> = {}) =>
    ({
        id: "task-1",
        name: "Setup",
        status: TaskStatus.toDo,
        tags: ["tag-a"],
        assignee_id: "user-1",
        reviewer_id: "user-1",
        start_time: new Date("2026-01-01T10:00:00.000Z"),
        end_time: new Date("2026-01-01T11:00:00.000Z"),
        ...overrides,
    }) as any;

const renderMenu = async (
    options: {
        tasks?: any[];
        appliedFilter?: any;
        setAppliedFilter?: (filter: any) => void;
        event?: any;
    } = {},
) => {
    const setAppliedFilter = options.setAppliedFilter ?? vi.fn();

    await act(async () => {
        render(
            <NotificationContextProvider>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <KanBanBoardMenu
                        tasksPromise={Promise.resolve(options.tasks ?? [makeTask()])}
                        eventPromise={options.event ? Promise.resolve(options.event) : undefined}
                        appliedFilter={options.appliedFilter ?? null}
                        setAppliedFilter={setAppliedFilter}
                    />
                </LocalizationProvider>
            </NotificationContextProvider>,
        );
    });

    return { setAppliedFilter };
};

describe("KanBanBoardMenu", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.english,
        } as any);
    });

    it("throws when user is not authenticated", () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: null,
            language: Language.english,
        } as any);

        expect(() =>
            render(
                <NotificationContextProvider>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <KanBanBoardMenu
                            tasksPromise={Promise.resolve([
                                makeTask({ assignee_id: "other-user" }),
                            ])}
                            appliedFilter={null}
                            setAppliedFilter={vi.fn()}
                        />
                    </LocalizationProvider>
                </NotificationContextProvider>,
            ),
        ).toThrow("Unauthorized");
    });

    it("shows no-shifts text when user has no booked shifts", async () => {
        await renderMenu({ tasks: [makeTask({ assignee_id: "other-user" })] });

        expect(screen.getByText("No volunteer shifts booked")).toBeInTheDocument();
    });

    it("renders grouped my-shifts content", async () => {
        await renderMenu({
            tasks: [
                makeTask({ id: "task-1", name: "Setup" }),
                makeTask({
                    id: "task-2",
                    name: "Setup",
                    start_time: new Date("2026-01-01T12:00:00.000Z"),
                }),
                makeTask({ id: "task-3", name: "Cleanup" }),
            ],
        });

        expect(screen.getAllByTestId("draggable-task-shifts")).toHaveLength(2);
    });

    it("applies filter values from filter tab form", async () => {
        const { setAppliedFilter } = await renderMenu({ tasks: [makeTask()] });

        await userEvent.click(screen.getByRole("tab", { name: "Filter" }));
        await userEvent.click(screen.getByRole("switch", { name: "Not booked" }));
        await userEvent.click(screen.getByRole("button", { name: "Apply" }));

        expect(setAppliedFilter).toHaveBeenCalled();
        const [calledWith] = (setAppliedFilter as any).mock.calls[0];
        expect(calledWith).toEqual(expect.objectContaining({ unassigned: true }));
    });

    it("clears filter when clear button is clicked", async () => {
        const { setAppliedFilter } = await renderMenu({ tasks: [makeTask()] });

        await userEvent.click(screen.getByRole("tab", { name: "Filter" }));
        await userEvent.click(screen.getByRole("button", { name: "Clear" }));

        expect(setAppliedFilter).toHaveBeenCalledWith(null);
    });

    it("prints visible schedule to pdf and opens resulting URL", async () => {
        const createObjectUrlSpy = vi
            .spyOn(URL, "createObjectURL")
            .mockReturnValue("blob:kanban-schedule");

        await renderMenu({ tasks: [makeTask()] });

        await userEvent.click(screen.getByRole("tab", { name: "Filter" }));
        await userEvent.click(screen.getByRole("button", { name: "Print Schedule" }));

        await waitFor(() => {
            expect(pdf).toHaveBeenCalledTimes(1);
            expect(openResourceInNewTab).toHaveBeenCalledWith("blob:kanban-schedule");
        });

        createObjectUrlSpy.mockRestore();
    });

    it("renders swedish menu labels", async () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1" },
            language: Language.swedish,
        } as any);

        await renderMenu({ tasks: [makeTask({ assignee_id: "other-user" })] });

        expect(screen.getByRole("tab", { name: "Mina skift" })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: "Filter" })).toBeInTheDocument();
        expect(screen.getByText("Inga volontärskift bokade")).toBeInTheDocument();
    });
});
