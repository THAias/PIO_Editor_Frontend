import { QuestionCircleFilled } from "@ant-design/icons";
import { Form, Input } from "antd";
import { Rule, RuleObject } from "antd/es/form";
import React from "react";

import { IInputTextAreaProps } from "../../@types/InputTypes";

const { TextArea } = Input;

/**
 * Custom basic component for text area input field
 * @param {IInputTextAreaProps} props IInputTextAreaProps interface
 * @returns {React.JSX.Element} React element
 */
const InputTextArea = (props: IInputTextAreaProps): React.JSX.Element => {
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
                <TextArea
                    autoSize={{ minRows: 2, maxRows: 5 }}
                    placeholder={props.placeholder}
                    disabled={props.disabled}
                />
            </Form.Item>
        </div>
    );
};
export default InputTextArea;
