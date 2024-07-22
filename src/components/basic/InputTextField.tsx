import { QuestionCircleFilled } from "@ant-design/icons";
import { Form, Input } from "antd";
import { Rule, RuleObject } from "antd/es/form";
import React from "react";

import { IInputTextFieldProps } from "../../@types/InputTypes";

/**
 * Custom basic component for text input field
 * @param {IInputTextFieldProps} props IInputTextFieldProps interface
 * @returns {React.JSX.Element} React element
 */
const InputTextField = (props: IInputTextFieldProps): React.JSX.Element => {
    const wide: boolean = props.wide ?? true;
    const required: boolean = (props.rules && props.rules.some((rule: Rule) => (rule as RuleObject).required)) ?? false;

    // Handler function for removing a text field
    const handleRemove = (): void => {
        if (props.removeHandler) props.removeHandler(props.label, props.name);
    };

    return (
        <div className={`base-input ${wide ? "wide" : "small"}`}>
            <Form.Item
                name={props.name}
                label={props.label}
                tooltip={props.helpText && { title: props.helpText, icon: <QuestionCircleFilled /> }}
                required={required}
                rules={props.rules}
            >
                <Input
                    type={"string"}
                    placeholder={props.placeholder}
                    disabled={props.disabled}
                    addonAfter={props.removable && <div onClick={handleRemove}>x</div>}
                />
            </Form.Item>
        </div>
    );
};

export default InputTextField;
