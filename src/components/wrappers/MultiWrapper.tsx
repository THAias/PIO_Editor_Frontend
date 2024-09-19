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
    const exportState: string | undefined = useSelector((state: RootState) => state.navigationState.exportPio);
    const [activeKey, setActiveKey] = useState<string | string[] | undefined>(undefined);
    const [removeBlocker, setRemoveBlocker] = useState<boolean>(false);

    //Unfold all collapse items while exporting a PIO. Necessary for validating all input fields
    useEffect((): void => {
        if (exportState && items) {
            setActiveKey(Array.from({ length: (items as []).length }, (_, index: number) => index.toString()));
        } else {
            setActiveKey(undefined);
        }
    }, [exportState]);

    /** Increments all active keys with +1 */
    const incrementActiveKey = (): void => {
        setActiveKey((prevState: string | string[] | undefined) => {
            if (!prevState) return [];
            else if (Array.isArray(prevState)) return prevState.map((key: string) => (Number(key) + 1).toString());
            else return prevState + 1;
        });
    };

    /**
     * Updates the activeKey state, when removing items from multiWrapper.
     * @param {number} removedKey Key of the item that should be removed starting with 0
     */
    const removeActiveKey = (removedKey: number): void => {
        setActiveKey((prevState: string | string[] | undefined) => {
            if (!prevState || !Array.isArray(prevState)) return [];
            return prevState
                .map((x: string): string | undefined => {
                    //Don't change prevState key, if removed key is greater
                    if (Number(x) < removedKey) return x;
                    //Delete prevState key, if removed key is equal (undefined will be filtered afterwards)
                    else if (Number(x) === removedKey) return undefined;
                    //Decrement prevState key with -1, if removed key is less
                    else return (Number(x) - 1).toString();
                })
                .filter((x: string | undefined) => x !== undefined) as string[];
        });
    };

    return (
        <>
            <div className={"extended-form-line"}>
                <Form.List name={componentName}>
                    {(fields: FormListFieldData[], { remove }) => {
                        return (
                            <>
                                <div
                                    className={"accordion-new-entry"}
                                    onClick={() => {
                                        console.log(activeKey);
                                        setModalOpen(true);
                                    }}
                                    style={{ cursor: "pointer" }}
                                >
                                    <PlusOutlined />
                                    <p>{addText}</p>
                                </div>
                                <div className={"accordion-wrapper"}>
                                    <Collapse
                                        bordered={false}
                                        onChange={(activeIndex: string | string[]) => {
                                            setTimeout(() => {
                                                if (!removeBlocker) setActiveKey(activeIndex);
                                            }, 50);
                                        }}
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
                                                                setRemoveBlocker(true);
                                                                remove(name);
                                                                setTimeout(() => {
                                                                    form.submit();
                                                                    removeActiveKey(name);
                                                                    setRemoveBlocker(false);
                                                                }, 100);
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
                        incrementActiveKey();
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
