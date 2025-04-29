import { ExpandMore } from "@mui/icons-material";
import {
    Accordion,
    AccordionSummary,
    FormControl,
    FormControlLabel,
    Radio,
    RadioGroup,
    Stack,
    Typography,
} from "@mui/material";
import { FC } from "react";

interface IAccordionRadioGroup {
    title: string;
    value: string;
    setValue: (value: string) => void;
    valueOptions: { [key: string]: string };
}

const AccordionRadioGroup: FC<IAccordionRadioGroup> = ({
    title,
    value,
    setValue,
    valueOptions,
}) => {
    return (
        <Accordion sx={{ padding: 1 }} defaultExpanded={true}>
            <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>{title}</Typography>
            </AccordionSummary>
            <Stack spacing={2} padding={1}>
                <FormControl>
                    <RadioGroup value={value} onChange={(e) => setValue(e.target.value)}>
                        {Object.values(valueOptions).map((option) => (
                            <FormControlLabel
                                key={option}
                                value={option}
                                control={<Radio />}
                                label={option}
                            />
                        ))}
                    </RadioGroup>
                </FormControl>
            </Stack>
        </Accordion>
    );
};

export default AccordionRadioGroup;
