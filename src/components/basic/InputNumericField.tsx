import { QuestionCircleFilled } from "@ant-design/icons";
import { Form, Input } from "antd";
import { Rule, RuleObject } from "antd/es/form";
import React from "react";

import { IInputNumericFieldProps } from "../../@types/InputTypes";

/**
 * Custom basic component for numeric input field
 * @param {IInputNumericFieldProps} props IInputNumericFieldProps interface
 * @returns {React.JSX.Element} React element
 */
const InputNumericField = (props: IInputNumericFieldProps): React.JSX.Element => {
    const wide: boolean = props.wide ?? true;
    const required: boolean = (props.rules && props.rules.some((rule: Rule) => (rule as RuleObject).required)) ?? false;

    return (
        <div className={`base-input ${wide ? "wide" : "small"}`}>
            <Form.Item
                name={props.name}
                label={props.label}
                tooltip={props.helpText && { title: props.helpText, icon: <QuestionCircleFilled /> }}
                required={required}
                initialValue={props.value}
                rules={props.rules}
            >
                <Input
                    type={"number"}
                    min={props.min ?? "0"}
                    max={props.max}
                    step={props.step ?? "1"}
                    placeholder={props.placeholder}
                    disabled={props.disabled}
                />
            </Form.Item>
        </div>
    );
};

export default InputNumericField;
