import { QuestionCircleFilled } from "@ant-design/icons";
import { SelectOption } from "@thaias/pio_fhir_resources";
import { Checkbox, Form, FormInstance, Select } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import { Rule, RuleObject } from "antd/es/form";
import React from "react";

import { IInputDropDownProps } from "../../@types/InputTypes";

/**
 * Custom basic component for dropdown
 * @param {IInputDropDownProps} props InputDropDownProps interface
 * @returns {React.JSX.Element} React element
 */
const InputDropDown = (props: IInputDropDownProps): React.JSX.Element => {
    const [sort, setSort] = React.useState<boolean>(false);
    const allowClear: boolean = props.allowClear ?? true;
    const required: boolean = (props.rules && props.rules.some((rule: Rule) => (rule as RuleObject).required)) ?? false;
    const multiple: boolean = props.multiple ?? false;
    const searchable: boolean = props.searchable ?? true;
    const wide: boolean = (props.wide ?? true) || props.unknownCheckboxValue !== undefined;
    const form: FormInstance = Form.useFormInstance();

    const dropdownUnknown = Form.useWatch(props.unknownCheckboxName ?? "", form);

    return (
        <div className={`dropdown base-input ${wide ? "wide" : "small"}`}>
            <Form.Item
                label={props.label}
                tooltip={props.helpText && { title: props.helpText, icon: <QuestionCircleFilled /> }}
                required={required}
            >
                {multiple && <div className={"multiple-label"}>(Mehrfache Auswahl möglich)</div>}
                <div className={"input-dropdown-line"}>
                    <div className={`input-dropdown ${wide ? "wide" : "small"}`}>
                        <Form.Item noStyle name={props.name} rules={props.rules} initialValue={props.defaultValue}>
                            <Select
                                onSearch={(value: string): void => {
                                    setSort(value !== "");
                                }}
                                mode={multiple ? "multiple" : undefined}
                                showSearch={searchable}
                                placeholder={props.placeholder}
                                disabled={dropdownUnknown === "unknown" || props.disabled}
                                onChange={() => form.submit()}
                                options={props.options}
                                allowClear={allowClear}
                                onClear={() => form.submit()}
                                virtual={true}
                                filterOption={(input: string, option: SelectOption | undefined): boolean => {
                                    return props.searchByValue
                                        ? (option?.label ?? "").toLowerCase().includes(input.toLowerCase()) ||
                                              (option?.value ?? "").toLowerCase().includes(input.toLowerCase())
                                        : (option?.label ?? "").toLowerCase().includes(input.toLowerCase());
                                }}
                                filterSort={
                                    sort
                                        ? (optionA: SelectOption, optionB: SelectOption) =>
                                              (optionA?.label ?? "")
                                                  .toLowerCase()
                                                  .localeCompare((optionB?.label ?? "").toLowerCase())
                                        : undefined
                                }
                                optionLabelProp={"label"}
                            ></Select>
                        </Form.Item>
                    </div>
                    {props.unknownCheckboxName ? (
                        <div className={"unknown-checkbox"}>
                            <Form.Item
                                noStyle
                                name={
                                    Array.isArray(props.unknownCheckboxName) && props.unknownCheckboxName.length > 1
                                        ? props.unknownCheckboxName.slice(1)
                                        : props.unknownCheckboxName
                                }
                                valuePropName={"checked"}
                            >
                                <Checkbox
                                    defaultChecked={dropdownUnknown === "unknown"}
                                    onChange={(event: CheckboxChangeEvent): void => {
                                        if (event.target.checked) {
                                            form.setFieldValue(props.unknownCheckboxName, props.unknownCheckboxValue);
                                            form.resetFields([props.name]);
                                        } else form.setFieldValue(props.unknownCheckboxName, undefined);
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

export default InputDropDown;
