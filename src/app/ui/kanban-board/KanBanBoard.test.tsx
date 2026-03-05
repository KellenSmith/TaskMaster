import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import KanBanBoard from "./KanBanBoard";
import { useUserContext } from "../../context/UserContext";
import { isUserAdmin, isUserHost } from "../../lib/utils";
import { Language, TaskStatus } from "../../../prisma/generated/enums";

const droppableColumnMock = vi.fn();
const kanbanMenuMock = vi.fn();

vi.mock("./DroppableColumn", () => ({
    __esModule: true,
    default: (props: { status: TaskStatus; readOnly: boolean; appliedFilter: unknown }) => {
        droppableColumnMock(props);
        return <div data-testid={`column-${props.status}`}>{props.status}</div>;
    },
}));

vi.mock("./KanBanBoardMenu", () => ({
    __esModule: true,
    default: (props: {
        appliedFilter: { status?: TaskStatus[] } | null;
        setAppliedFilter: (value: { status: TaskStatus[] } | null) => void;
    }) => {
        kanbanMenuMock(props);
        return (
            <div>
                <button onClick={() => props.setAppliedFilter({ status: [TaskStatus.done] })}>
                    set done filter
                </button>
                <button onClick={() => props.setAppliedFilter(null)}>clear filter</button>
            </div>
        );
    },
}));

vi.mock("../../lib/utils", async (importOriginal) => {
    const actual = (await importOriginal()) as object;
    return {
        ...actual,
        isUserHost: vi.fn(() => false),
        isUserAdmin: vi.fn(() => false),
    };
});

const toFulfilledThenable = <T,>(value: T) =>
    ({
        status: "fulfilled",
        value,
        then: (onFulfilled?: (resolved: T) => unknown) => Promise.resolve(onFulfilled?.(value)),
    }) as unknown as Promise<T>;

const tasks = [
    {
        id: "task-1",
        name: "Task 1",
        status: TaskStatus.toDo,
        start_time: new Date("2026-01-01T10:00:00.000Z"),
        end_time: new Date("2026-01-01T11:00:00.000Z"),
        assignee_id: null,
        reviewer_id: "user-1",
        tags: [],
        skill_badges: [],
    },
] as any;

const event = {
    id: "event-1",
    tickets: [],
} as any;

const renderKanban = (props: Partial<React.ComponentProps<typeof KanBanBoard>> = {}) =>
    render(
        <KanBanBoard
            readOnly={true}
            tasksPromise={toFulfilledThenable(tasks)}
            skillBadgesPromise={toFulfilledThenable([])}
            {...props}
        />,
    );

describe("KanBanBoard", () => {
    beforeEach(() => {
        droppableColumnMock.mockClear();
        kanbanMenuMock.mockClear();
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1", role: "member" },
            language: Language.english,
        } as any);
        vi.mocked(isUserAdmin).mockReturnValue(false);
        vi.mocked(isUserHost).mockReturnValue(false);
    });

    it("renders non-event prompt and all status columns for non-admin/host", () => {
        renderKanban();

        expect(
            screen.getByText(
                "A little work every day keeps our community running. Sign up for a shift to join the fun!",
            ),
        ).toBeInTheDocument();
        expect(screen.getByTestId("column-toDo")).toBeInTheDocument();
        expect(screen.getByTestId("column-inProgress")).toBeInTheDocument();
        expect(screen.getByTestId("column-inReview")).toBeInTheDocument();
        expect(screen.getByTestId("column-done")).toBeInTheDocument();
    });

    it("renders event prompt and defaults to toDo status for non-admin/host event board", () => {
        renderKanban({ eventPromise: toFulfilledThenable(event) });

        expect(screen.getByText("Want to volunteer? Book a shift!")).toBeInTheDocument();
        expect(screen.getByTestId("column-toDo")).toBeInTheDocument();
        expect(screen.queryByTestId("column-inProgress")).not.toBeInTheDocument();
        expect(screen.queryByTestId("column-inReview")).not.toBeInTheDocument();
        expect(screen.queryByTestId("column-done")).not.toBeInTheDocument();
    });

    it("does not pre-filter statuses for admin users", () => {
        vi.mocked(isUserAdmin).mockReturnValue(true);

        renderKanban({ eventPromise: toFulfilledThenable(event) });

        expect(screen.getByTestId("column-toDo")).toBeInTheDocument();
        expect(screen.getByTestId("column-inProgress")).toBeInTheDocument();
        expect(screen.getByTestId("column-inReview")).toBeInTheDocument();
        expect(screen.getByTestId("column-done")).toBeInTheDocument();
    });

    it("passes readOnly and filter props to each DroppableColumn", () => {
        renderKanban({ readOnly: false });

        expect(droppableColumnMock).toHaveBeenCalled();
        for (const call of droppableColumnMock.mock.calls) {
            expect(call[0].readOnly).toBe(false);
            expect(call[0].appliedFilter).toEqual(
                expect.objectContaining({
                    unassigned: true,
                }),
            );
        }
    });

    it("updates rendered columns when menu applies a status filter", async () => {
        renderKanban();

        await userEvent.click(screen.getByRole("button", { name: "set done filter" }));

        expect(screen.getByTestId("column-done")).toBeInTheDocument();
        expect(screen.queryByTestId("column-toDo")).not.toBeInTheDocument();
        expect(screen.queryByTestId("column-inProgress")).not.toBeInTheDocument();
        expect(screen.queryByTestId("column-inReview")).not.toBeInTheDocument();
    });

    it("renders swedish prompt when language is swedish", () => {
        vi.mocked(useUserContext).mockReturnValue({
            user: { id: "user-1", role: "member" },
            language: Language.swedish,
        } as any);

        renderKanban();

        expect(
            screen.getByText(
                "Lite arbete varje dag håller vår förening igång. Anmäl dig för ett skift för att delta i det roliga!",
            ),
        ).toBeInTheDocument();
    });
});
