import { QuestionCircleFilled } from "@ant-design/icons";
import { SelectOption } from "@thaias/pio_fhir_resources";
import { Form, FormInstance, Radio, RadioChangeEvent } from "antd";
import { Rule, RuleObject } from "antd/es/form";
import React, { useEffect, useState } from "react";

import { IRadioButtonProps } from "../../@types/InputTypes";

/**
 * Custom basic component for radio buttons
 * @param {IRadioButtonProps} props InputRadioButtonProps interface
 * @returns {React.JSX.Element} React element
 */
const RadioButton = (props: IRadioButtonProps): React.JSX.Element => {
    const required: boolean = (props.rules && props.rules.some((rule: Rule) => (rule as RuleObject).required)) ?? false;
    const [selected, setSelected] = useState<string | null>(props.required ? (props.value ?? null) : null);
    const form: FormInstance = Form.useFormInstance();
    // Handler function for selection change
    const handleChange = (event: RadioChangeEvent): void => {
        if (props.onChange) {
            props.onChange(event.target.value);
        }
        if (!props.addButton && props.modal === false) form.submit();
        setSelected(props.addButton ? null : event.target.value);
    };

    useEffect(() => {
        if (props.disabled) form.resetFields([props.name]);
    }, [form, props.disabled, props.name]);

    const direction: "vertical" | "horizontal" | undefined = props.vertical ? "vertical" : "horizontal";

    return (
        <div className={`base-input ${direction}`}>
            <Form.Item
                name={props.name}
                label={props.label}
                tooltip={props.helpText && { title: props.helpText, icon: <QuestionCircleFilled /> }}
                required={required}
                rules={props.rules}
                initialValue={props.value}
            >
                <Radio.Group onChange={handleChange} value={selected} disabled={props.disabled}>
                    {props.options.map((item: SelectOption) => {
                        return (
                            <Radio key={item.value} value={item.value}>
                                {item.label}
                            </Radio>
                        );
                    })}
                    {!props.addButton && props.unknownOption !== false && (
                        <Radio key={"undefined"} value={undefined}>
                            Keine Angabe
                        </Radio>
                    )}
                </Radio.Group>
            </Form.Item>
        </div>
    );
};

export default RadioButton;
