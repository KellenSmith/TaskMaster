import "@testing-library/jest-dom";
import { expect, afterEach, vi, beforeEach, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { mockContext } from "./mocks/prismaMock";
import dayjs from "dayjs";
import type { Transporter } from "nodemailer";
import { getMailTransport } from "../app/lib/mail-service/mail-transport";
import testdata from "./testdata";
import { prisma } from "../prisma/prisma-client";
import { Language } from "../prisma/generated/enums";
import { Prisma } from "../prisma/generated/browser";
import isoWeek from "dayjs/plugin/isoWeek";
import "dayjs/locale/en-gb";
import updateLocale from "dayjs/plugin/updateLocale";

const locale = "en-gb";
dayjs.extend(isoWeek);
dayjs.extend(updateLocale);
dayjs.locale(locale);
dayjs.updateLocale(locale, {
    weekStart: 1,
    weekdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    weekdaysShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
});

// Extend vitest's expect method with testing-library methods
expect.extend(matchers);

const originalEnv = process.env;

vi.mock("../prisma/prisma-client", () => ({
    prisma: mockContext.prisma,
}));
vi.mock("@/app/lib/mail-service/mail-transport", () => ({
    getMailTransport: vi.fn().mockResolvedValue({
        sendMail: vi.fn().mockResolvedValue({ accepted: [], rejected: [] }),
    } as unknown as Transporter),
}));
vi.mock("next/cache", () => ({
    revalidateTag: vi.fn(),
}));
vi.mock("next/navigation", () => ({
    useRouter: vi.fn(() => ({ push: vi.fn() })),
    redirect: vi.fn(() => {
        throw new Error("Redirect called");
    }),
}));
vi.mock("../app/context/ThemeContext", () => ({
    useTheme: vi.fn(() => ({
        palette: {
            mode: "dark",
        },
    })),
}));
vi.mock("../app/context/UserContext", () => ({
    useUserContext: vi.fn(() => ({
        user: null,
        language: Language.english,
        setLanguage: vi.fn(() => {}),
        editMode: false,
        setEditMode: vi.fn(() => {}),
    })),
}));
vi.mock("../app/context/OrganizationSettingsContext", () => ({
    useOrganizationSettingsContext: vi.fn(() => ({
        organizationSettings: {
            organizationSettings: {
                id: "orgsettingsid",
                remind_membership_expires_in_days: 7,
                purge_members_after_days_unvalidated: 180,
                default_task_shift_length: 2,
                member_application_prompt: "Please provide a brief introduction about yourself.",
                ticket_instructions:
                    "Please include any relevant information or questions you have about the event.",
            } as Prisma.OrganizationSettingsGetPayload<true>,
            infopagesPromise: Promise.resolve([]),
        },
    })),
}));

afterAll(() => {
    process.env = originalEnv;
});

beforeEach(() => {
    vi.resetAllMocks();

    // Provide stable env defaults for tests
    process.env = { ...originalEnv, ...testdata.env };
    // Reassert mockimplementation for mail transport before each test
    vi.mocked(getMailTransport).mockResolvedValue({
        sendMail: vi.fn().mockResolvedValue({ accepted: [], rejected: [] }),
    } as unknown as Transporter);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        return await callback(mockContext.prisma as any);
    });
    vi.mock("dayjs", () => {
        const actualDayjs = vi.importActual("dayjs");
        return actualDayjs;
    });
});

// Clear up after each test
afterEach(() => {
    cleanup();
});
