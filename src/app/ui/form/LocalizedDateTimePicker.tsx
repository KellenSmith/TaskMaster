import { DateTimePicker, DateTimePickerProps } from "@mui/x-date-pickers";

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
            timezone={process.env.NEXT_PUBLIC_TIMEZONE || "Europe/Stockholm"}
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
