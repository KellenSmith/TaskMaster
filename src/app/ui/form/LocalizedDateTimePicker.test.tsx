import { render, screen } from "@testing-library/react";
import LocalizedDateTimePicker from "./LocalizedDateTimePicker";
import LocalizationContextProvider from "../../context/LocalizationContext";
import { DateTimePickerProps } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import { dateDisplayFormat } from "../../lib/zod-schemas";

const renderLocalizedDatePicker = (props: DateTimePickerProps = {}) => {
    render(
        <LocalizationContextProvider>
            <LocalizedDateTimePicker fieldId={"testId"} {...props} />
        </LocalizationContextProvider>,
    );
};

describe("LocalizedDateTimePicker", () => {
    it("accepts and displays empty value", () => {
        renderLocalizedDatePicker({ defaultValue: null });
        const year = screen.getByText("YYYY");
        const month = screen.getByText("MM");
        const day = screen.getByText("DD");
        const hour = screen.getByText("hh");
        const minute = screen.getByText("mm");
        expect(year).toBeInTheDocument();
        expect(month).toBeInTheDocument();
        expect(day).toBeInTheDocument();
        expect(hour).toBeInTheDocument();
        expect(minute).toBeInTheDocument();
    });
    it("accepts and displays a valid utc date in Europe/Stockholm time zone by default", () => {
        const utcDate = dayjs.utc("06/05/2026 12:00", dateDisplayFormat);
        renderLocalizedDatePicker({ defaultValue: utcDate });

        // Don't hardcode expected date due to summer time. The offset from UTC changes during the year.
        const expectedDisplayedDate = utcDate.tz("Europe/Stockholm").format(dateDisplayFormat);
        const displayedDate = screen.getByDisplayValue(expectedDisplayedDate);
        expect(displayedDate).toBeInTheDocument();
    });
    it("accepts and displays a valid utc date in env time zone", () => {
        process.env.NEXT_PUBLIC_TIMEZONE = "America/New_York";

        const utcDate = dayjs.utc("06/05/2026 12:00", dateDisplayFormat);
        renderLocalizedDatePicker({ defaultValue: utcDate });

        const expectedDisplayedDate = utcDate
            .tz(process.env.NEXT_PUBLIC_TIMEZONE)
            .format(dateDisplayFormat);
        const displayedDate = screen.getByDisplayValue(expectedDisplayedDate);
        expect(displayedDate).toBeInTheDocument();
    });
});
