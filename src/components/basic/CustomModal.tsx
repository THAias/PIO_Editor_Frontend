import { Form, Modal } from "antd";
import React from "react";

import { ICustomModalProps } from "../../@types/InputTypes";
import "../../styles/basic/customModal.scss";

/**
 * Custom basic modal component rendering specific forms for referenced resources
 * @param {ICustomModalProps} props ICustomModalProps interface
 * @returns {React.JSX.Element} React element
 */
const CustomModal = <T extends object>(props: ICustomModalProps<T>): React.JSX.Element => {
    const [form] = Form.useForm();

    return (
        <div
            onBlur={(event: React.FocusEvent<HTMLDivElement>): void => {
                event.stopPropagation();
            }}
        >
            <Modal
                maskClosable={false}
                open={props.open}
                title={props.label}
                width={888}
                destroyOnClose={true}
                okText={"Übernehmen"}
                onCancel={props.onCancel}
                onOk={(): void => {
                    form.validateFields()
                        .then((values): void => {
                            form.resetFields();
                            if (props.onOK) props.onOK(values);
                        })
                        .catch((info): void => {
                            console.error("Validate Failed:", info);
                        });
                }}
            >
                <Form form={form} layout={"vertical"}>
                    {props.content}
                </Form>
            </Modal>
        </div>
    );
};

export default CustomModal;
