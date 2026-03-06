import { act, render, screen } from "@testing-library/react";
import ErrorBoundarySuspense, { ErrorFallback, LoadingFallback } from "./ErrorBoundarySuspense";
import { useUserContext } from "../context/UserContext";
import { Language } from "../../prisma/generated/enums";
import { allowRedirectException } from "./utils";

vi.mock("./utils", async (importOriginal) => {
    const actual = (await importOriginal()) as object;
    return {
        ...actual,
        allowRedirectException: vi.fn(),
    };
});

describe("ErrorBoundarySuspense", () => {
    beforeEach(() => {
        vi.mocked(useUserContext).mockReturnValue({ language: Language.english } as any);
    });

    it("renders children when no error or suspense is triggered", () => {
        render(
            <ErrorBoundarySuspense>
                <div>Loaded content</div>
            </ErrorBoundarySuspense>,
        );

        expect(screen.getByText("Loaded content")).toBeInTheDocument();
    });

    it("renders loading fallback while child is suspended and then renders content", async () => {
        let resolveSuspense: (() => void) | null = null;
        let isResolved = false;
        const pendingPromise = new Promise<void>((resolve) => {
            resolveSuspense = () => {
                isResolved = true;
                resolve();
            };
        });

        const SuspendedChild = () => {
            if (!isResolved) throw pendingPromise;
            return <div>Loaded after suspense</div>;
        };

        render(
            <ErrorBoundarySuspense>
                <SuspendedChild />
            </ErrorBoundarySuspense>,
        );

        expect(screen.getByRole("progressbar")).toBeInTheDocument();

        await act(async () => {
            resolveSuspense?.();
            await pendingPromise;
        });

        expect(await screen.findByText("Loaded after suspense")).toBeInTheDocument();
    });

    it("renders error fallback and forwards error to allowRedirectException", async () => {
        const error = new Error("boom");
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

        const BrokenChild = () => {
            throw error;
        };

        render(
            <ErrorBoundarySuspense>
                <BrokenChild />
            </ErrorBoundarySuspense>,
        );

        expect(await screen.findByText("An unexpected error occurred")).toBeInTheDocument();
        expect(allowRedirectException).toHaveBeenCalledWith(error);
        expect(consoleErrorSpy).toHaveBeenCalled();
    });
});

describe("ErrorFallback", () => {
    it("renders english translation", () => {
        vi.mocked(useUserContext).mockReturnValue({ language: Language.english } as any);

        render(<ErrorFallback />);

        expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument();
    });

    it("renders swedish translation", () => {
        vi.mocked(useUserContext).mockReturnValue({ language: Language.swedish } as any);

        render(<ErrorFallback />);

        expect(screen.getByText("Ett oväntat fel inträffade")).toBeInTheDocument();
    });
});

describe("LoadingFallback", () => {
    it("renders a loading spinner", () => {
        render(<LoadingFallback />);

        expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
});
