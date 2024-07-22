import { IContactPersonObject } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form, FormInstance } from "antd";
import { NamePath } from "antd/es/form/interface";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 } from "uuid";

import { ISingleWrapperProps } from "../../@types/FormTypes";
import { AppDispatch, RootState } from "../../@types/ReduxTypes";
import contactPersonActions from "../../redux/actions/ContactPersonActions";
import { getFullPath, getNameLabel } from "../../services/HelperService";
import ValueSets from "../../services/ValueSetService";
import CustomModal from "../basic/CustomModal";
import InputDatePicker from "../basic/InputDatePicker";
import InputDropDown from "../basic/InputDropDown";
import InputTextArea from "../basic/InputTextArea";
import { ContactPersonWrapper } from "./ContactPersonWrapper";

/**
 * This component wraps the form fields for a single care problem.
 * @param {ISingleWrapperProps} props ISingleWrapperProps props interface
 * @returns {React.JSX.Element} React element
 */
const ConsentStatementWrapper = (props: ISingleWrapperProps): React.JSX.Element => {
    // ValueSets and Options
    const policyRuleValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Health_Care_Proxy_Type"
    );
    const policyCodeOptions: SelectOptions = policyRuleValueSet.getOptionsSync;
    const contactPersonReduxState: IContactPersonObject[] = useSelector((state: RootState) => state.contactPersonState);
    const contactPersonsOptions: SelectOptions = [
        { label: "Kontaktperson hinzufügen", value: "addContactPerson" },
        ...contactPersonReduxState.map(
            (contactPerson: IContactPersonObject): SelectOption => ({
                label: getNameLabel(contactPerson.name),
                value: contactPerson.id,
            })
        ),
    ];

    const form: FormInstance = Form.useFormInstance();
    const [contactModalOpen, setContactModalOpen] = useState<boolean>(false);

    const fullPath: NamePath = getFullPath(props);
    const proxy = Form.useWatch(fullPath.concat("proxy"), form);
    const proxyUnknown = Form.useWatch(fullPath.concat("proxyUnknown"), form);
    const dispatch: AppDispatch = useDispatch();

    // Hook to open modal for new contact person
    useEffect((): void => {
        if (proxy === "addContactPerson") setContactModalOpen(true);
        if (proxyUnknown === "unknown") form.setFieldValue(fullPath.concat("proxy"), undefined);
    }, [proxy, proxyUnknown]);

    const saveNewContactPerson = (contactPersonObject: IContactPersonObject): void => {
        setContactModalOpen(false);
        dispatch(contactPersonActions.addContactPersonRedux(contactPersonObject));
        form.setFieldValue(fullPath.concat("proxy"), contactPersonObject.id);
    };

    return (
        <>
            <Form.Item name={props.name !== undefined ? [props.name, "id"] : "id"} hidden={true} initialValue={v4()}>
                <div style={{ display: "hidden" }} />
            </Form.Item>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        name={props.name !== undefined ? [props.name, "policyRule"] : "policyRule"}
                        label={"Art der Erklärung"}
                        placeholder={"Art der Erklärung wählen"}
                        options={policyCodeOptions}
                        rules={[{ required: true, message: "Bitte wählen Sie eine Diagnose aus!" }]}
                    />
                </div>
                <div className={"right"}>
                    <InputDatePicker
                        name={props.name !== undefined ? [props.name, "dateTime"] : "dateTime"}
                        label={"Datum"}
                        placeholder={"Datum auswählen"}
                        future={true}
                    />
                </div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        options={contactPersonsOptions}
                        name={props.name !== undefined ? [props.name, "proxy"] : "proxy"}
                        label={"Bevollmächtigte Person"}
                        placeholder={"Bevollmächtigte Person auswählen"}
                    />
                </div>
                <div className={"right"}>
                    <InputTextArea
                        name={props.name !== undefined ? [props.name, "comment"] : "comment"}
                        label={"Kommentar"}
                        placeholder={"Ggf. Ergänzungen zur persönlichen Erklärung..."}
                    />
                </div>
            </div>
            {contactModalOpen && (
                <CustomModal<IContactPersonObject>
                    content={<ContactPersonWrapper />}
                    label={"Neue Kontaktperson hinzufügen"}
                    open={contactModalOpen}
                    onOK={saveNewContactPerson}
                    onCancel={(): void => {
                        setContactModalOpen(false);
                        form.setFieldValue(fullPath.concat("proxy"), undefined);
                    }}
                />
            )}
        </>
    );
};

export default ConsentStatementWrapper;
