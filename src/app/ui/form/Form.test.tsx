import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Form from "./Form";
import GlobalConstants from "../../GlobalConstants";
import { useNotificationContext } from "../../context/NotificationContext";
import { useRouter } from "next/navigation";

vi.mock("../../context/NotificationContext", () => ({
    useNotificationContext: vi.fn(),
}));

const addNotificationMock = vi.fn();
const SUCCESS_MESSAGE = "Saved";

// An unconfigured form name renders only the custom fields we ask for
const renderForm = (props: Partial<React.ComponentProps<typeof Form>> = {}) =>
    render(
        <Form
            name="form-under-test"
            buttonLabel="Submit"
            action={vi.fn(async () => SUCCESS_MESSAGE)}
            customIncludedFields={[GlobalConstants.NICKNAME]}
            readOnly={false}
            editable={false}
            {...props}
        />,
    );

const submit = async () => {
    await userEvent.type(screen.getByRole("textbox", { name: /nickname/i }), "Johnny");
    await userEvent.click(screen.getByRole("button", { name: "Submit" }));
};

describe("Form success handling", () => {
    beforeEach(() => {
        addNotificationMock.mockClear();
        // The global next/navigation mock has no refresh(), which Form calls after success
        vi.mocked(useRouter).mockReturnValue({ push: vi.fn(), refresh: vi.fn() } as any);
        vi.mocked(useNotificationContext).mockReturnValue({
            addNotification: addNotificationMock,
        } as any);
    });

    it("shows the action result as a success toast by default", async () => {
        renderForm();
        await submit();
        await waitFor(() =>
            expect(addNotificationMock).toHaveBeenCalledWith(SUCCESS_MESSAGE, "success"),
        );
    });

    it("hands the result to onSuccess instead of toasting when provided", async () => {
        const onSuccess = vi.fn();
        renderForm({ onSuccess });
        await submit();
        await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(SUCCESS_MESSAGE));
        expect(addNotificationMock).not.toHaveBeenCalled();
    });

    it("hands the error message to onError instead of toasting when provided", async () => {
        const onError = vi.fn();
        renderForm({
            onError,
            action: vi.fn(async () => {
                throw new Error("Nope");
            }),
        });
        await submit();
        await waitFor(() => expect(onError).toHaveBeenCalledWith("Nope"));
        expect(addNotificationMock).not.toHaveBeenCalled();
    });

    it("still toasts errors when onSuccess is provided", async () => {
        const onSuccess = vi.fn();
        renderForm({
            onSuccess,
            action: vi.fn(async () => {
                throw new Error("Nope");
            }),
        });
        await submit();
        await waitFor(() => expect(addNotificationMock).toHaveBeenCalledWith("Nope", "error"));
        expect(onSuccess).not.toHaveBeenCalled();
    });
});
