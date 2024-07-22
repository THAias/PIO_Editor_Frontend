import { ITelecomObject } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form, FormInstance, FormListFieldData, Space } from "antd";
import React from "react";

import { ITelecomWrapperProps } from "../../@types/FormTypes";
import { getFullPath } from "../../services/HelperService";
import ValueSets from "../../services/ValueSetService";
import AddButton from "../basic/AddButton";
import InputTextField from "../basic/InputTextField";

const telecomTypeValueSet: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/contact-point-system");

/**
 * Wrapper component for telecom
 * @param {ITelecomWrapperProps} props Initial properties
 * @returns {React.JSX.Element} React element
 */
const TelecomWrapper = (props: ITelecomWrapperProps): React.JSX.Element => {
    //ValueSets
    const telecomSystemOptions: SelectOptions = telecomTypeValueSet.getOptionsSync;
    const form: FormInstance = Form.useFormInstance();
    const addressBook: boolean = props.addressBook ?? false;
    const fullPath: string[] = getFullPath(props);

    //Helper function for adding new telecom fields to form
    const addNewTelecom = (chosen: string): void => {
        //Get old telecom data and prepare a new empty item
        const prevTelecom: ITelecomObject[] = form.getFieldValue(fullPath);
        const newTelecom: ITelecomObject = {
            system: chosen,
            label: telecomSystemOptions.find((option: SelectOption): boolean => option.value === chosen)?.label ?? "",
            value: "",
        };

        let completeTelecom: ITelecomObject[] = [];
        if (prevTelecom === undefined) {
            completeTelecom = [newTelecom];
        } else if (Array.isArray(prevTelecom)) {
            completeTelecom = [...prevTelecom, newTelecom];
        }

        form.setFieldValue(fullPath, completeTelecom);
    };

    const onRemove = (remove: () => void): void => {
        remove();
        form.submit();
    };

    return (
        <>
            <div className={"extended-form-line"}>
                <div className={"left"}>
                    <div className={"form-subtitle"}>Kontaktkanäle</div>
                    <AddButton onChange={addNewTelecom} options={telecomSystemOptions} vertical={true} />
                </div>
            </div>
            <div>
                <Form.List
                    name={props.name}
                    initialValue={[
                        { system: "email", label: "E-Mail", value: "" },
                        { system: "phone", label: "Telefon", value: "" },
                    ]}
                >
                    {(fields: FormListFieldData[], { remove }) => (
                        <Space
                            className={addressBook ? "wideFieldSpace addressBook" : "wideFieldSpace"}
                            size={[0, 0]}
                            direction={"horizontal"}
                        >
                            {fields.map(
                                ({ key, name }): React.JSX.Element => (
                                    <div key={key} className={name % 2 === 0 ? "left" : "right"}>
                                        <Form.Item hidden={true} name={[name, "label"]}>
                                            <div style={{ display: "hidden" }} />
                                        </Form.Item>
                                        <Form.Item hidden={true} name={[name, "system"]}>
                                            <div style={{ display: "hidden" }} />
                                        </Form.Item>
                                        <InputTextField
                                            name={[name, "value"]}
                                            label={form.getFieldValue([...fullPath, name, "label"])}
                                            placeholder={form.getFieldValue([...fullPath, name, "label"])}
                                            removable={true}
                                            removeHandler={() => onRemove(() => remove(name))}
                                        />
                                    </div>
                                )
                            )}
                        </Space>
                    )}
                </Form.List>
            </div>
        </>
    );
};

export default TelecomWrapper;
