import { IAddressObject, IOrganizationObject, IPractitionerObject, IResponse } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form, FormInstance } from "antd";
import { NamePath } from "antd/es/form/interface";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 } from "uuid";

import { ISingleWrapperProps } from "../../@types/FormTypes";
import { AppDispatch, RootState } from "../../@types/ReduxTypes";
import organizationActions from "../../redux/actions/OrganizationActions";
import practitionerActions from "../../redux/actions/PractitionerActions";
import { reduxStore } from "../../redux/store";
import AddressBookService from "../../services/AddressBookService";
import { getAddressLabel, getFullPath } from "../../services/HelperService";
import { helperTextPractitionerWrapper } from "../../services/HelperTextService";
import ValueSets from "../../services/ValueSetService";
import AddButton from "../basic/AddButton";
import CustomModal from "../basic/CustomModal";
import InputDropDown from "../basic/InputDropDown";
import InputTextArea from "../basic/InputTextArea";
import InputTextField from "../basic/InputTextField";
import AddressWrapper from "./AddressWrapper";
import MultiWrapper from "./MultiWrapper";
import NameWrapper from "./NameWrapper";
import OrganizationWrapper from "./OrganizationWrapper";
import TelecomWrapper from "./TelecomWrapper";

const qualificationValueSet: ValueSets = new ValueSets(
    "https://fhir.kbv.de/ValueSet/KBV_VS_Base_Practitioner_Speciality"
);
const specialityValueSet: ValueSets = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_SFHIR_BAR2_ARZTNRFACHGRUPPE");

/**
 * Wrapper component for Practitioner
 * @param {ISingleWrapperProps} props ISingleWrapperProps props interface
 * @returns {React.JSX.Element} React element
 */
const PractitionerWrapper = (props: ISingleWrapperProps): React.JSX.Element => {
    //ValueSets, Options, State and Form setup
    const qualificationOptions: SelectOptions = qualificationValueSet.getOptionsSync;
    const organizationReduxState: IOrganizationObject[] = useSelector((state: RootState) => state.organizationState);
    const organizationOptions: SelectOptions = [
        { label: "Neue Einrichtung hinzufügen", value: "newOrganization" },
        ...organizationReduxState.map((org: IOrganizationObject): SelectOption => ({ label: org.name, value: org.id })),
    ];
    const specialityOptions: SelectOptions = specialityValueSet.getOptionsSync;
    const roleValueSet: ValueSets = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Rolecare");
    const roleOptions: SelectOptions = roleValueSet.getOptionsSync;
    const [identificationNumbers, setIdentificationNumber] = useState<SelectOptions>([]);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const dispatch: AppDispatch = useDispatch();
    const possibleIdentificationNumbers: { [key: string]: SelectOption } = {
        ZANR: { label: "Zahnarztnummer", value: "ZANR" },
        EFN: { label: "Fortbildungsnummer", value: "EFN" },
        ANR: { label: "Arztnummer", value: "ANR" },
    };
    const fullPath: NamePath = getFullPath(props);
    const form: FormInstance = Form.useFormInstance();
    const organizationValue = Form.useWatch(fullPath.concat("organization"), form);

    //Hook for opening modal on new organization selection
    useEffect((): void => {
        if (organizationValue === "newOrganization") setModalOpen(true);
    }, [organizationValue]);

    //Initial hook for setting identification state
    useEffect((): void => {
        const practitioner: IPractitionerObject = form.getFieldValue(fullPath);
        const tempIdentificationNumbers: SelectOptions = [];
        if (practitioner !== undefined) {
            if (practitioner.ZANR !== undefined) tempIdentificationNumbers.push(possibleIdentificationNumbers.ZANR);
            if (practitioner.EFN !== undefined) tempIdentificationNumbers.push(possibleIdentificationNumbers.EFN);
            if (practitioner.ANR !== undefined) tempIdentificationNumbers.push(possibleIdentificationNumbers.ANR);

            if (tempIdentificationNumbers.length === 0)
                tempIdentificationNumbers.push(possibleIdentificationNumbers.ANR);
            setIdentificationNumber(tempIdentificationNumbers);
        }
    }, []);

    //Helper for adding new identification numbers
    const addIdentificationNumber = (value: string): void => {
        const newIdentificationNumber: SelectOption = possibleIdentificationNumbers[value.toString()];
        const newIdentificationNumbers: SelectOptions = [...identificationNumbers, newIdentificationNumber];
        setIdentificationNumber(newIdentificationNumbers);
    };

    //Helper for removing identification numbers
    const removeIdentificationNumber = (label: string): void => {
        form.resetFields([fullPath.concat(label)]);
        const newIdentificationNumbers: SelectOptions = identificationNumbers.filter(
            (identificationNumber: SelectOption): boolean => {
                return identificationNumber.value !== label;
            }
        );
        setIdentificationNumber(newIdentificationNumbers);
        form.submit();
    };

    //Helper for getting options for add button
    const getAddButtonOptions = (): SelectOptions => {
        // return all identificationNumber selectOption which aren't already added
        return Object.values(possibleIdentificationNumbers).filter((possibleIdentificationNumber: SelectOption) => {
            return !identificationNumbers.some(
                (identificationNumber: SelectOption): boolean =>
                    identificationNumber.value === possibleIdentificationNumber.value
            );
        });
    };

    //Helper for saving new organization and setting necessary field values/closing the modal
    const saveNewOrganization = (organizationObject: IOrganizationObject): void => {
        //Close Modal and save new organization to address book
        setModalOpen(false);
        AddressBookService.addAddressBookItem(organizationObject).then((result: IResponse): void => {
            if (result.success) {
                dispatch(organizationActions.addOrganizationRedux(organizationObject));
            }
        });

        //Set form field value
        form.setFieldValue(fullPath.concat("organization"), {
            label: organizationObject.name,
            value: organizationObject.id,
        });

        //Update organization uuid in IPractitionerObject in redux
        const copyOfCurrentState: IPractitionerObject[] = [
            ...(reduxStore.getState().practitionerState as IPractitionerObject[]),
        ].map((item: IPractitionerObject) => {
            return { ...item };
        });
        const index: number = copyOfCurrentState.findIndex(
            (p: IPractitionerObject) => p.organization === "newOrganization"
        );
        if (index !== -1) {
            copyOfCurrentState[index.valueOf()].organization = organizationObject.id;
            dispatch(practitionerActions.updatePractitionerRedux(copyOfCurrentState));
        }
    };

    //Constants for helper texts etc.
    const helperTextObject: { [key: string]: string } = {
        ZANR: helperTextPractitionerWrapper.ZANR,
        EFN: helperTextPractitionerWrapper.EFN,
        ANR: helperTextPractitionerWrapper.ANR,
    };
    return (
        <>
            <Form.Item name={props.name !== undefined ? [props.name, "id"] : "id"} hidden={true} initialValue={v4()}>
                <div style={{ display: "hidden" }}></div>
            </Form.Item>
            <Form.Item
                name={props.name !== undefined ? [props.name, "author"] : "author"}
                hidden={true}
                initialValue={false}
            >
                <div style={{ display: "hidden" }}></div>
            </Form.Item>
            <NameWrapper
                maidenName={false}
                name={props.name !== undefined ? [props.name, "practitionerName"] : "practitionerName"}
                parentName={props.parentName}
                isAuthor={form.getFieldValue(fullPath.concat("author"))}
            />
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        label={"Funktionsbezeichnung"}
                        name={props.name !== undefined ? [props.name, "qualification"] : "qualification"}
                        options={qualificationOptions}
                        placeholder={"Funktionsbezeichnung wählen"}
                    />
                </div>
                <div className={"right"}>
                    <InputDropDown
                        label={"Fachrichtung der Person"}
                        name={props.name !== undefined ? [props.name, "speciality"] : "speciality"}
                        options={specialityOptions}
                        placeholder={"Fachrichtung wählen"}
                    />
                </div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        label={"Einrichtung"}
                        name={props.name !== undefined ? [props.name, "organization"] : "organization"}
                        options={organizationOptions}
                        placeholder={"Einrichtung wählen"}
                        rules={[
                            {
                                required: true,
                                message: "Bitte wählen Sie eine Einrichtung aus.",
                            },
                        ]}
                        helpText={helperTextPractitionerWrapper.organization}
                    />
                </div>
                <div className={"right"}>
                    <InputDropDown
                        label={"Rolle der Person in der Einrichtung"}
                        name={props.name !== undefined ? [props.name, "role"] : "role"}
                        options={roleOptions}
                        placeholder={"Rolle wählen"}
                    />
                </div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <div className={"form-subtitle"}>Personenbezogene Identifikatoren</div>
                    {identificationNumbers.length < 3 ? (
                        <AddButton
                            onChange={addIdentificationNumber}
                            type={"identificationNumbers"}
                            vertical={false}
                            options={getAddButtonOptions()}
                        />
                    ) : undefined}
                </div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    {identificationNumbers.map(
                        (identificationNumber: SelectOption): React.JSX.Element => (
                            <InputTextField
                                key={identificationNumber.value}
                                name={
                                    props.name !== undefined
                                        ? [props.name, identificationNumber.value]
                                        : identificationNumber.value
                                }
                                label={identificationNumber.value}
                                placeholder={identificationNumber.label}
                                wide={false}
                                removable={true}
                                removeHandler={(label: string) => removeIdentificationNumber(label)}
                                helpText={helperTextObject[identificationNumber.value]}
                            />
                        )
                    )}
                </div>
            </div>
            <TelecomWrapper
                name={props.name !== undefined ? [props.name, "telecom"] : "telecom"}
                parentName={props.parentName}
            />
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputTextArea
                        name={props.name !== undefined ? [props.name, "additionalInfo"] : "additionalInfo"}
                        label={"Ergänzende Angaben zur behandelnden Person"}
                        placeholder={"Ggf. ergänzende Angaben zur behandelnden Person"}
                    />
                </div>
            </div>
            <MultiWrapper<IAddressObject>
                componentName={props.name !== undefined ? [props.name, "address"] : "address"}
                nestedWrapperParentLabel={props.parentName}
                SingleWrapper={AddressWrapper}
                addText={"Addresse Hinzufügen"}
                label={getAddressLabel}
            />
            {modalOpen && (
                <CustomModal<IOrganizationObject>
                    label={"Neue Einrichtung hinzufügen"}
                    content={<OrganizationWrapper />}
                    open={modalOpen}
                    onOK={saveNewOrganization}
                    onCancel={(): void => {
                        setModalOpen(false);
                        form.setFieldValue(fullPath.concat("organization"), undefined);
                    }}
                />
            )}
        </>
    );
};

export default PractitionerWrapper;
