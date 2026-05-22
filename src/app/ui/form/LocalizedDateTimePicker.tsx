import { DateTimePicker, DateTimePickerProps } from "@mui/x-date-pickers";
import { dateDisplayFormat, localTimeZone } from "../../context/LocalizationContext";

interface LocalizedDatePickerProps {
    fieldId: string;
    required?: boolean;
}

const LocalizedDateTimePicker = ({
    fieldId,
    required,
    ...props
}: LocalizedDatePickerProps & DateTimePickerProps) => {
    return (
        <DateTimePicker
            name={fieldId}
            format={dateDisplayFormat}
            timezone={localTimeZone}
            slotProps={{
                textField: {
                    name: fieldId,
                    required: required,
                },
                // TODO: Implement translation for action buttons
                actionBar: { actions: ["clear", "accept"] },
            }}
            {...props}
        />
    );
};

export default LocalizedDateTimePicker;
