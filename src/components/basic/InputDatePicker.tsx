import { QuestionCircleFilled } from "@ant-design/icons";
import { Checkbox, DatePicker, Form, FormInstance } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import { Rule, RuleObject } from "antd/es/form";
import dayjs, { Dayjs } from "dayjs";
import React from "react";

import { IDatePickerProps } from "../../@types/InputTypes";

/**
 * Custom basic component for a datepicker with additional checkbox
 * @param {IDatePickerProps} props InputDatePickerProps interface
 * @returns {React.JSX.Element} React element
 */
const InputDatePicker = (props: IDatePickerProps): React.JSX.Element => {
    const wide: boolean = props.wide ?? true;
    const dateFormat = "DD.MM.YYYY";
    const form: FormInstance = Form.useFormInstance();
    const required: boolean = (props.rules && props.rules.some((rule: Rule) => (rule as RuleObject).required)) ?? false;
    const errorMessage: string | React.ReactElement | undefined = (
        (props.rules && props.rules.find((rule: Rule) => (rule as RuleObject).required)) as RuleObject
    )?.message;
    const disabled: boolean = props.disabled ?? false;

    const birthdateUnknown = Form.useWatch(props.unknownCheckboxName ?? "", form);

    /**
     * Filter helper for limiting date to don't choose future dates.
     * @param {Dayjs | null} current Current date
     * @returns {boolean} True if current date is after today
     */
    const disabledDate = (current: Dayjs | null): boolean => {
        if (props.future !== true && current) {
            return current > dayjs();
        }
        return false;
    };

    return (
        <div className={`date-picker base-input ${wide ? "wide" : "small"}`}>
            <Form.Item
                label={props.label}
                tooltip={props.helpText && { title: props.helpText, icon: <QuestionCircleFilled /> }}
                required={required}
            >
                <div className={"input-date-picker-line"}>
                    <div className={"input-date-picker"}>
                        <Form.Item
                            noStyle
                            name={props.name}
                            rules={[
                                {
                                    required: birthdateUnknown
                                        ? required && birthdateUnknown !== props.unknownCheckBoxValue
                                        : required,
                                    message: errorMessage,
                                },
                            ]}
                        >
                            <DatePicker
                                format={dateFormat}
                                placeholder={dateFormat}
                                disabled={
                                    (birthdateUnknown !== undefined &&
                                        birthdateUnknown === props.unknownCheckBoxValue) ||
                                    disabled
                                }
                                onChange={props.onChange}
                                disabledDate={props.disabledDate ?? disabledDate}
                            />
                        </Form.Item>
                    </div>
                    {props.unknownCheckboxName ? (
                        <div className={"unknown-checkbox"}>
                            <Form.Item noStyle name={props.unknownCheckboxName} valuePropName={"checked"}>
                                <Checkbox
                                    defaultChecked={birthdateUnknown === props.unknownCheckBoxValue}
                                    onChange={(event: CheckboxChangeEvent): void => {
                                        if (event.target.checked) {
                                            form.setFieldValue(
                                                props.unknownCheckboxName as string,
                                                props.unknownCheckBoxValue
                                            );
                                            form.setFieldValue(props.name as string, undefined);
                                        } else {
                                            form.setFieldValue(props.unknownCheckboxName as string, undefined);
                                        }
                                    }}
                                />
                            </Form.Item>
                            <div className={"unknown-checkbox-label"}>Unbekannt</div>
                        </div>
                    ) : null}
                </div>
            </Form.Item>
        </div>
    );
};

export default InputDatePicker;
