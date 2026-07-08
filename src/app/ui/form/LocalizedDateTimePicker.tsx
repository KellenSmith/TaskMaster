import { DateTimePicker, DateTimePickerProps } from "@mui/x-date-pickers";
import {
    dateDisplayFormat,
    localTimeZone,
    utcDateToTzDate,
} from "../../context/LocalizationContext";
import { useEffect, useMemo, useState } from "react";
import { Dayjs } from "dayjs";

interface LocalizedDatePickerProps {
    fieldId: string;
    required?: boolean;
}

const LocalizedDateTimePicker = ({
    fieldId,
    required,
    ...props
}: LocalizedDatePickerProps & DateTimePickerProps) => {
    const { defaultValue, disabled, onChange, slotProps, ...dateTimePickerProps } = props;
    const initialLocalValue = useMemo(() => utcDateToTzDate(defaultValue), [defaultValue]);
    const [localValue, setLocalValue] = useState<Dayjs | null>(initialLocalValue);

    useEffect(() => {
        setLocalValue(initialLocalValue);
    }, [initialLocalValue]);

    const utcSubmittedValue =
        localValue && localValue.isValid() ? localValue.tz("UTC").format(dateDisplayFormat) : "";

    return (
        <>
            <input
                type="hidden"
                name={fieldId}
                value={utcSubmittedValue}
                disabled={disabled}
                data-testid={`${fieldId}-utc-value`}
            />
            <DateTimePicker
                {...dateTimePickerProps}
                format={dateDisplayFormat}
                timezone={localTimeZone}
                value={localValue}
                onChange={(newValue, context) => {
                    setLocalValue(newValue);
                    onChange?.(newValue, context);
                }}
                slotProps={{
                    ...slotProps,
                    textField: {
                        ...slotProps?.textField,
                        required: required,
                    },
                    // TODO: Implement translation for action buttons
                    actionBar: {
                        actions: ["clear", "accept"],
                        ...slotProps?.actionBar,
                    },
                }}
            />
        </>
    );
};

export default LocalizedDateTimePicker;
