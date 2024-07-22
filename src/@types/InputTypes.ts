import { SelectOptions } from "@thaias/pio_fhir_resources";
import { Rule } from "antd/es/form";
import { NamePath } from "antd/es/form/interface";
import { Dayjs } from "dayjs";
import React from "react";

/**
 * An interface for all input fields
 * @property {string} name Unique name if the input field
 * @property {string} label label string which will be printed above the input field
 * @property {boolean} required true | false for mandatory field
 * @property {string} helpText optional information for helper text
 * @property {string} placeholder optional placeholder text
 * @property {boolean} disabled optional disable state for component
 * @property {Rule[]} rules optional rules for validation
 */
export interface IInput {
    name: NamePath;
    label: string;
    helpText?: string;
    placeholder?: string;
    disabled?: boolean;
    rules?: Rule[];
}

/**
 * The Props Interface for the Radio Button Component
 * @property {string} name Unique name if the input field
 * @property {string} label label string which will be printed above the input field
 * @property {boolean} required true | false for mandatory field
 * @property {string} helpText optional information for helper text
 * @property {boolean} disabled optional disable state for component
 * @property {Rule[]} rules optional rules for validation
 * @property {string} value optional preset value
 * @property {Function} onChange handles selection of radio button
 * @property {SelectOptions} options list of options for radio button
 * @property {boolean} vertical true for vertical list, false for horizontal
 * @property {boolean} addButton true for adding new options, false for normal radio button
 * @property {boolean} modal true for modal, false for normal radio button
 */
export interface IRadioButtonProps {
    name?: NamePath;
    label?: string;
    required?: boolean;
    helpText?: string;
    disabled?: boolean;
    rules?: Rule[];
    value?: string;
    onChange?: (selected: string) => void;
    options: SelectOptions;
    vertical?: boolean;
    addButton?: boolean;
    modal?: boolean;
    unknownOption?: boolean;
}

/**
 * An interface for AddButton props
 * @property {string} type specifies the type of the AddButton
 * @property {boolean} vertical true for vertical list, false for horizontal
 * @property {Function} onChange handles selection of add button
 * @property {SelectOptions} options list of options for add button
 */
export interface IAddButtonProps {
    type?: string;
    vertical?: boolean;
    onChange: (value: string) => void;
    options: SelectOptions;
}

/**
 * An interface for InputDropDown props
 * @property {boolean} wide specifies whether the input field is wide or small
 * @property {SelectOptions} options list of options for dropdown
 * @property {boolean} multiple true for multiple selection, false for single selection
 * @property {boolean} searchable true for searchable dropdown, false for normal dropdown
 * @property {string} unknownCheckboxName optional numeric identifier for index of mapped elements
 * @property {string} unknownCheckboxValue optional numeric identifier for index of mapped elements
 * @property {string} unknownInitialValue optional numeric identifier for index of mapped elements
 * @property {string} defaultValue optional numeric identifier for index of mapped elements
 */
export interface IInputDropDownProps extends IInput {
    wide?: boolean;
    options: SelectOptions;
    multiple?: boolean;
    searchable?: boolean;
    searchByValue?: boolean;
    unknownCheckboxName?: string | string[];
    unknownCheckboxValue?: string;
    unknownInitialValue?: boolean;
    defaultValue?: string;
    allowClear?: boolean;
}

/**
 * An interface for InputTextField props
 * @property {boolean} wide specifies whether the input field is wide or small
 * @property {string} value optional preset value
 * @property {boolean} removable optional boolean to clarify if the field is removable
 * @property {Function} removeHandler handler function to remove the field
 */
export interface IInputTextFieldProps extends IInput {
    wide?: boolean;
    value?: string;
    removable?: boolean;
    removeHandler?: (label: string, name: NamePath) => void;
}

/**
 * An interface for InputTextArea props
 * @property {boolean} wide specifies whether the input field is wide or small
 * @property {string} value optional preset value
 * @property {boolean} removable optional boolean to clarify if the field is removable
 * @property {Function} removeHandler handler function to remove the field
 */
export interface IInputTextAreaProps extends IInput {
    wide?: boolean;
    value?: string;
    removable?: boolean;
    removeHandler?: (value: string, name: NamePath) => void;
}

/**
 * An interface for InputNumericField props
 * @property {boolean} wide specifies whether the input field is wide or small
 * @property {string} value optional preset value
 * @property {number | string} min optional lower limit for input
 * @property {number | string} max optional upper limit for input
 * @property {number | string} step optional step size for input
 */
export interface IInputNumericFieldProps extends IInput {
    wide?: boolean;
    value?: string;
    max?: number | string;
    min?: number | string;
    step?: number | string;
}

/**
 * An interface for DatePicker props
 * @property {boolean} wide specifies whether the input field is wide or small
 * @property {string} unknownCheckboxName optional name for unknown checkbox
 * @property {string} unknownCheckBoxValue optional value for unknown checkbox
 * @property {boolean} unknownInitialValue optional initial value for unknown checkbox
 * @property {string} value optional preset value
 */
export interface IDatePickerProps extends IInput {
    wide?: boolean;
    disabled?: boolean;
    unknownCheckboxName?: string;
    unknownCheckBoxValue?: string;
    unknownInitialValue?: boolean;
    value?: string;
    onChange?: (date: Dayjs | null, dateString: string | string[]) => void;
    disabledDate?: (current: Dayjs | null) => boolean;
    future?: boolean;
}

/**
 * An interface for TimePeriod props
 * @property {boolean} wide specifies whether the input field is wide or small
 * @property {string} value optional preset value
 * @property {string} parentName optional name of parent component
 */
export interface ITimePeriodProps extends IInput {
    wide?: boolean;
    value?: string;
    parentName?: string;
    helperText?: string;
    future?: boolean;
}

/**
 * An interface for The CustomModal props with generic type T
 * @property {string} label label string which will be printed above the input field
 * @property {React.JSX.Element} content content of the modal
 * @property {boolean} open true | false for open modal
 * @property {Function} onOK handles ok button click of model and returns values of type T
 * @property {Function} onCancel handles cancel button click of model
 * @property {boolean} small optional boolean to clarify if the modal is small
 */
export interface ICustomModalProps<T> {
    label: string;
    content: React.JSX.Element;
    open: boolean;
    onOK?: (values: T) => void;
    onCancel?: () => void;
    small?: boolean;
}
