"use client";

import { Autocomplete, TextField } from "@mui/material";
import { FC, useCallback, useMemo, useState } from "react";
import { allowSelectMultiple, FieldLabels, RequiredFields, selectFieldOptions } from "./FieldCfg";

export interface CustomOptionProps {
    id: string;
    label: string;
}

interface AutocompleteWrapperProps {
    fieldId: string;
    name: string;
    label: string;
    defaultValue: string | string[];
    editMode: boolean;
    customReadOnlyFields?: string[];
    customOptions?: CustomOptionProps[];
}

const AutocompleteWrapper: FC<AutocompleteWrapperProps> = ({
    fieldId,
    name,
    label,
    defaultValue,
    editMode,
    customReadOnlyFields,
    customOptions,
}) => {
    const multiple = useMemo(() => allowSelectMultiple.includes(fieldId), [fieldId]);
    const options = useMemo<CustomOptionProps[]>(() => {
        if (customOptions) return customOptions;
        return selectFieldOptions[fieldId].map((option: string) => ({
            id: option,
            label: FieldLabels[option] || option,
        }));
    }, [fieldId, customOptions]);

    const getOptionWithId = useCallback(
        (id: string): CustomOptionProps | null =>
            options.find((option) => option.id === id) || null,
        [options],
    );

    // Initialize state with proper default values
    const getInitialValue = useCallback((): CustomOptionProps | CustomOptionProps[] => {
        if (!defaultValue) return multiple ? [] : null;
        if (typeof defaultValue === "string") return getOptionWithId(defaultValue);
        return defaultValue.map((val) => getOptionWithId(val)).filter(Boolean);
    }, [defaultValue, multiple, getOptionWithId]);

    const [selectedOption, setSelectedOption] = useState<CustomOptionProps | CustomOptionProps[]>(
        getInitialValue(),
    );

    const getHiddenValue = useCallback((): string => {
        if (!selectedOption) return "";
        if (Array.isArray(selectedOption)) {
            if (selectedOption.length < 1) return "";
            return selectedOption
                .map((val) => {
                    return val?.id;
                })
                .join(",");
        }
        return selectedOption.id;
    }, [selectedOption]);

    return (
        <>
            <Autocomplete
                value={selectedOption}
                onChange={(_: any, newValue: any) => setSelectedOption(newValue)}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={label}
                        required={name in RequiredFields && RequiredFields[name].includes(fieldId)}
                    />
                )}
                options={options}
                autoSelect={
                    (name in RequiredFields && RequiredFields[name].includes(fieldId)) ||
                    allowSelectMultiple.includes(fieldId)
                }
                multiple={allowSelectMultiple.includes(fieldId)}
                disabled={!editMode || customReadOnlyFields?.includes(fieldId)}
            />
            {/* Hidden input for form submission */}
            <input type="hidden" name={fieldId} value={getHiddenValue()} />
        </>
    );
};

export default AutocompleteWrapper;
