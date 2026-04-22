import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import KanBanBoardMenu, { filterOptions, getFilteredTasks } from "./KanBanBoardMenu";
import NotificationContextProvider from "../../context/NotificationContext";
import { useUserContext } from "../../context/UserContext";
import { Language, TaskStatus } from "../../../prisma/generated/enums";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { pdf } from "@react-pdf/renderer";
import { openResourceInNewTab } from "../utils";
import GlobalConstants from "../../GlobalConstants";
import dayjs, { Dayjs } from "../../lib/dayjs";

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
        start_time: dayjs("2026-01-01T10:00:00.000").toDate(),
        end_time: dayjs("2026-01-01T11:00:00.000").toDate(),
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
                    start_time: dayjs("2026-01-01T12:00:00.000").toDate(),
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

describe("filterOptions", () => {
    const tasks = [
        makeTask({
            id: "unassigned-1",
            assignee_id: null,
            reviewer_id: "reviewer-1",
            tags: ["tag-a"],
            status: TaskStatus.toDo,
            start_time: dayjs("2026-01-01T10:30:00.000").toDate(),
            end_time: dayjs("2026-01-01T11:00:00.000").toDate(),
        }),
        makeTask({
            id: "mine-1",
            assignee_id: "user-1",
            reviewer_id: "other-reviewer",
            tags: ["tag-b"],
            status: TaskStatus.inProgress,
            start_time: dayjs("2026-01-01T10:31:00.000").toDate(),
            end_time: dayjs("2026-01-01T11:01:00.000").toDate(),
        }),
        makeTask({
            id: "review-1",
            assignee_id: "user-2",
            reviewer_id: "user-1",
            tags: ["tag-c", "tag-d"],
            status: TaskStatus.done,
            start_time: dayjs("2026-01-01T10:29:00.000").toDate(),
            end_time: dayjs("2026-01-01T10:59:00.000").toDate(),
        }),
    ] as any[];

    it("filters unassigned tasks", () => {
        const result = filterOptions.unassigned({ tasks });
        expect(result?.map((task) => task.id)).toEqual(["unassigned-1"]);
    });

    it("filters tasks assigned to the provided user", () => {
        const result = filterOptions.assigned_to_me({ tasks, userId: "user-1" });
        expect(result?.map((task) => task.id)).toEqual(["mine-1"]);
    });

    it("filters tasks that require the provided user's review", () => {
        const result = filterOptions.for_me_to_review({ tasks, userId: "user-1" });
        expect(result?.map((task) => task.id)).toEqual(["review-1"]);
    });

    it("filters begins_after inclusively to the minute", () => {
        const result = filterOptions.begins_after({
            tasks,
            value: "2026-01-01T10:30:00.000",
        });
        expect(result?.map((task) => task.id)).toEqual(["unassigned-1", "mine-1"]);
    });

    it("filters ends_before inclusively to the minute", () => {
        const result = filterOptions.ends_before({
            tasks,
            value: "2026-01-01T11:00:00.000",
        });
        expect(result?.map((task) => task.id)).toEqual(["unassigned-1", "review-1"]);
    });

    it("filters tasks by selected tags", () => {
        const result = filterOptions.has_tag({ tasks, value: ["tag-d", "tag-x"] });
        expect(result?.map((task) => task.id)).toEqual(["review-1"]);
    });

    it("filters tasks by selected statuses", () => {
        const result = filterOptions[GlobalConstants.STATUS]({
            tasks,
            value: [TaskStatus.done, TaskStatus.toDo],
        });
        expect(result?.map((task) => task.id)).toEqual(["unassigned-1", "review-1"]);
    });
});

describe("getFilteredTasks", () => {
    const tasks = [
        makeTask({
            id: "task-a",
            assignee_id: null,
            reviewer_id: "user-2",
            status: TaskStatus.toDo,
        }),
        makeTask({
            id: "task-b",
            assignee_id: "user-1",
            reviewer_id: "user-2",
            status: TaskStatus.inProgress,
        }),
        makeTask({
            id: "task-c",
            assignee_id: "user-2",
            reviewer_id: "user-1",
            status: TaskStatus.done,
        }),
    ] as any[];

    it("returns all tasks unchanged when no filter is applied", () => {
        const result = getFilteredTasks(null, tasks, "user-1");
        expect(result).toBe(tasks);
    });

    it("combines multiple filter buckets as a union", () => {
        const result = getFilteredTasks(
            {
                unassigned: true,
                assigned_to_me: true,
            } as any,
            tasks,
            "user-1",
        );

        expect(result.map((task) => task.id)).toEqual(["task-a", "task-b"]);
    });

    it("deduplicates tasks that match multiple filters", () => {
        const overlappingTasks = [
            makeTask({ id: "task-overlap", assignee_id: "user-1", reviewer_id: "user-1" }),
        ] as any[];

        const result = getFilteredTasks(
            {
                assigned_to_me: true,
                for_me_to_review: true,
            } as any,
            overlappingTasks,
            "user-1",
        );

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("task-overlap");
    });
});
