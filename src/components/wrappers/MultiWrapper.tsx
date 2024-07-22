import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { Collapse, CollapseProps, Form, FormInstance, FormListFieldData, Tooltip } from "antd";
import { NamePath } from "antd/es/form/interface";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import { IMultiWrapperProps, ISingleWrapperProps } from "../../@types/FormTypes";
import { RootState } from "../../@types/ReduxTypes";
import "../../styles/basic/accordion.scss";
import CustomModal from "../basic/CustomModal";

/**
 * The MultiWrapper component to manage accordions and their modals
 * @param {IMultiWrapperProps} props Props for the MultiWrapper
 * @param {React.FC<ISingleWrapperProps>} props.SingleWrapper The content to render in the accordion and in the modal
 * @param {NamePath} props.componentName Name of the component where the multiWrapper is used
 * @param {Function} props.label Label function to render the label of the accordion
 * @param {string} props.addText Text for the add button
 * @param {NamePath} props.nestedWrapperParentLabel Name of the component if the wrapper is wrapped in another wrapper
 * @returns {React.JSX.Element} React element
 */
const MultiWrapper = <T extends object>(props: IMultiWrapperProps<T>): React.ReactElement => {
    const SingleWrapper: React.FC<ISingleWrapperProps> = props.SingleWrapper;
    const componentName: NamePath = props.componentName;
    const label: (obj: T) => string = props.label;
    const addText: string = props.addText;
    const nestedWrapperParentLabel: NamePath = props.nestedWrapperParentLabel;
    //State, Form and Constants setup
    const form: FormInstance = Form.useFormInstance();
    const fullPath: NamePath =
        nestedWrapperParentLabel && Array.isArray(componentName)
            ? [nestedWrapperParentLabel, ...componentName]
            : componentName;
    const items = Form.useWatch(fullPath, form);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const practitioner: boolean = props.componentName === "practitioner";
    const exportState: boolean = useSelector((state: RootState) => state.navigationState.exportPio);
    const [activeKey, setActiveKey] = useState<string | string[] | undefined>(undefined);

    useEffect((): void => {
        if (exportState && items) {
            setActiveKey(Array.from({ length: (items as []).length }, (_, index: number) => index.toString()));
        } else {
            setActiveKey(undefined);
        }
    }, [exportState]);
    return (
        <>
            <div className={"extended-form-line"}>
                <Form.List name={componentName}>
                    {(fields: FormListFieldData[], { remove }) => {
                        return (
                            <>
                                <div
                                    className={"accordion-new-entry"}
                                    onClick={() => setModalOpen(true)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <PlusOutlined />
                                    <p>{addText}</p>
                                </div>
                                <div className={"accordion-wrapper"}>
                                    <Collapse
                                        bordered={false}
                                        onChange={setActiveKey}
                                        destroyInactivePanel={false}
                                        activeKey={activeKey}
                                        items={
                                            fields.map(({ name }: { name: number }) => {
                                                let deletable: boolean = true;
                                                if (practitioner && items?.[name.valueOf()]?.author === true) {
                                                    deletable = false;
                                                }
                                                return {
                                                    key: name.toString(),
                                                    label: label(items?.[name.valueOf()]),
                                                    className: "accordion-panel",
                                                    extra: deletable ? (
                                                        <DeleteOutlined
                                                            className={"remove-button"}
                                                            onClick={(): void => {
                                                                remove(name);
                                                                setTimeout(() => form.submit(), 100);
                                                            }}
                                                        />
                                                    ) : (
                                                        <Tooltip title={props.deleteToolTipText}>
                                                            <DeleteOutlined
                                                                disabled={!deletable}
                                                                className={"remove-button disabled"}
                                                                onClick={undefined}
                                                            />
                                                        </Tooltip>
                                                    ),
                                                    children: (
                                                        <SingleWrapper
                                                            name={name}
                                                            parentName={componentName}
                                                            fullPath={props.fullPath ? fullPath : undefined}
                                                        />
                                                    ),
                                                };
                                            }) as CollapseProps["items"]
                                        }
                                    />
                                </div>
                            </>
                        );
                    }}
                </Form.List>
            </div>
            {modalOpen && (
                <CustomModal<T>
                    label={addText}
                    content={<SingleWrapper />}
                    open={modalOpen}
                    onOK={(values: T): void => {
                        const tempItems = items ?? [];
                        form.setFieldValue(fullPath, [values, ...tempItems]);
                        form.submit();
                        setModalOpen(false);
                    }}
                    onCancel={(): void => {
                        setModalOpen(false);
                    }}
                />
            )}
        </>
    );
};

export default MultiWrapper;
