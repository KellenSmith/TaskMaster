"use client";

import { Autocomplete, createFilterOptions, TextField } from "@mui/material";
import { FC, SyntheticEvent, useCallback, useMemo, useState } from "react";
import { allowSelectMultiple, FieldLabels, allowAddNew, selectFieldOptions } from "./FieldCfg";
import { useUserContext } from "../../context/UserContext";

export interface CustomOptionProps {
    id: string;
    label: string;
}

const filter = createFilterOptions<CustomOptionProps>();

interface AutocompleteWrapperProps {
    fieldId: string;
    label: string;
    defaultValue?: string | string[];
    editMode: boolean;
    customReadOnlyFields?: string[];
    customOptions?: CustomOptionProps[];
    required?: boolean;
    customMultiple?: boolean;
}

const AutocompleteWrapper: FC<AutocompleteWrapperProps> = ({
    fieldId,
    label,
    defaultValue,
    editMode,
    customReadOnlyFields,
    customOptions,
    required,
    customMultiple,
}) => {
    const { language } = useUserContext();
    const multiple = useMemo(
        () => allowSelectMultiple.includes(fieldId) || customMultiple,
        [fieldId, customMultiple],
    );
    const options = useMemo<CustomOptionProps[]>(() => {
        if (customOptions) return customOptions;
        return selectFieldOptions[fieldId].map((option: string) => ({
            id: option,
            label: (FieldLabels[option]?.[language] as string) || option,
        }));
    }, [fieldId, customOptions, language]);

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

    const [selectedOption, setSelectedOption] = useState<
        CustomOptionProps | CustomOptionProps[] | null
    >(getInitialValue());

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
                onChange={(
                    _event: SyntheticEvent,
                    newValue: CustomOptionProps | CustomOptionProps[] | null,
                ) => setSelectedOption(newValue)}
                renderInput={(params) => (
                    <TextField {...params} label={label} required={required} />
                )}
                options={options as CustomOptionProps[]}
                filterOptions={(opts, params) => {
                    const optionsArr = opts as CustomOptionProps[];
                    const filtered = filter(optionsArr, params);
                    if (!allowAddNew.includes(fieldId)) return filtered;

                    const { inputValue } = params;
                    // Suggest the creation of a new value
                    const isExisting = optionsArr.some((option) => inputValue === option.label);
                    if (inputValue !== "" && !isExisting) {
                        filtered.push({
                            id: inputValue,
                            label: inputValue,
                        });
                    }
                    return filtered;
                }}
                autoSelect={required}
                multiple={multiple}
                selectOnFocus
                clearOnBlur
                disableCloseOnSelect={multiple}
                disabled={!editMode || customReadOnlyFields?.includes(fieldId)}
            />
            {/* Hidden input for form submission */}
            <input type="hidden" name={fieldId} value={getHiddenValue()} />
        </>
    );
};

export default AutocompleteWrapper;
