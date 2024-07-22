import { IAddressObject, IOrganizationIdentifierObject } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form, FormInstance, FormListFieldData } from "antd";
import React, { useEffect, useState } from "react";
import { v4 } from "uuid";

import { IOrganizationWrapperProps } from "../../@types/FormTypes";
import { getAddressLabel, getFullPath } from "../../services/HelperService";
import { helperTextOrganizationWrapper } from "../../services/HelperTextService";
import ValueSets from "../../services/ValueSetService";
import AddButton from "../basic/AddButton";
import InputDropDown from "../basic/InputDropDown";
import InputTextField from "../basic/InputTextField";
import AddressWrapper from "./AddressWrapper";
import MultiWrapper from "./MultiWrapper";
import TelecomWrapper from "./TelecomWrapper";

const organizationTypeValueSet: ValueSets = new ValueSets(
    "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Type_Of_Facility"
);
const identifierTypesValueSet: ValueSets = new ValueSets("http://fhir.de/ValueSet/identifier-type-de-basis");

/**
 * Wrapper component for organizations
 * @param {IOrganizationWrapperProps} props IOrganizationWrapperProps props interface
 * @returns {React.JSX.Element} React element
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
const OrganizationWrapper = (props: IOrganizationWrapperProps): React.JSX.Element => {
    //ValueSets, Options, State and Form setup
    const form: FormInstance = Form.useFormInstance();
    const fullPath: string[] = getFullPath(props);
    const addressBook: boolean = props.addressBook ?? false;
    const organizationTypeOptions: SelectOptions = organizationTypeValueSet.getOptionsSync;
    const initialIdentifierOptions: SelectOptions = identifierTypesValueSet.getOptionsSync
        .filter((item: SelectOption) => ["BSNR", "XX", "KZVA", "PRN"].includes(item.value))
        .map((item: SelectOption): SelectOption => {
            switch (item.value) {
                case "BSNR":
                    return { ...item, label: "Betriebsstättennummer" };
                case "XX":
                    return { value: "IK-Nummer", label: "IK-Nummer" };
                case "KZVA":
                    return { ...item, label: "KZV-Abrechnungsnummer" };
                case "PRN":
                    return { ...item, label: "Telematik-ID" };
                default:
                    return item;
            }
        });
    const [identifierOptions, setIdentifierOptions] = useState<SelectOptions>([]);
    const identifierWatcher = Form.useWatch(fullPath.concat("identifier"), form);

    //Hook for updating identifier options
    useEffect((): void => {
        const identifier: IOrganizationIdentifierObject[] = form.getFieldValue(fullPath.concat("identifier"));
        const identifierValues: string[] = identifier?.map(
            (identifierObj: IOrganizationIdentifierObject): string => identifierObj.label
        );
        const newIdentifierOptions: SelectOptions = initialIdentifierOptions.filter(
            (option: SelectOption): boolean => !identifierValues?.includes(option.value)
        );
        setIdentifierOptions(newIdentifierOptions);
    }, [identifierWatcher]);

    //Helper function for adding a new identifier to an array of identifiers
    const addIdentifier = (value: string): void => {
        const prevIdentifiers: IOrganizationIdentifierObject[] = form.getFieldValue(fullPath.concat("identifier"));
        const newIdentifier: IOrganizationIdentifierObject = {
            label: value,
            value: "",
        };
        const completeIdentifiers: IOrganizationIdentifierObject[] = prevIdentifiers
            ? [...prevIdentifiers, newIdentifier]
            : [newIdentifier];
        form.setFieldValue(fullPath.concat("identifier"), completeIdentifiers);
    };

    //Constants for helper texts etc.
    const identifierHelperText: Record<string, string> = {
        BSNR: helperTextOrganizationWrapper.BSNR,
        "IK-Nummer": helperTextOrganizationWrapper.IK,
        KZVA: helperTextOrganizationWrapper.KZVA,
        PRN: helperTextOrganizationWrapper.PRN,
    };
    const identifierFullLabel: Record<string, string> = {
        BSNR: "Betriebsstättennummer",
        "IK-Nummer": "IK-Nummer",
        KZVA: "KZV-Abrechnungsnummer",
        PRN: "Telematik-ID",
    };

    const onRemove = (remove: () => void): void => {
        remove();
        form.submit();
    };

    return (
        <>
            <Form.Item name={props.name !== undefined ? [props.name, "id"] : "id"} hidden={true} initialValue={v4()}>
                <div style={{ display: "hidden" }} />
            </Form.Item>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputTextField
                        rules={[{ required: true, message: "Bitte geben Sie einen Namen ein." }]}
                        name={props.name !== undefined ? [props.name, "name"] : "name"}
                        label={"Name der Einrichtung"}
                        placeholder={"Name"}
                    />
                    <AddButton onChange={addIdentifier} options={identifierOptions} vertical={true} />
                </div>
                <div className={"right"}>
                    <Form.List name={props.name !== undefined ? [props.name, "identifier"] : "identifier"}>
                        {(fields: FormListFieldData[], { remove }) => (
                            <>
                                {fields.map(({ key, name }) => {
                                    const label = form.getFieldValue([...fullPath.concat("identifier"), name, "label"]);
                                    return (
                                        <div key={key}>
                                            <Form.Item hidden={true} name={[name, "label"]}>
                                                <div style={{ display: "hidden" }} />
                                            </Form.Item>
                                            <InputTextField
                                                name={[name, "value"]}
                                                label={label}
                                                placeholder={identifierFullLabel[label?.toString()]}
                                                helpText={identifierHelperText[label?.toString()]}
                                                wide={false}
                                                removable={true}
                                                removeHandler={(): void => onRemove(() => remove(name))}
                                            />
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </Form.List>
                </div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        name={props.name !== undefined ? [props.name, "type"] : "type"}
                        label={"Einrichtungstyp"}
                        options={organizationTypeOptions}
                        placeholder={"Einrichtungstyp"}
                    />
                </div>
            </div>
            <TelecomWrapper
                name={props.name !== undefined ? [props.name, "telecom"] : "telecom"}
                parentName={props.parentName}
                addressBook={addressBook}
            />
            <MultiWrapper<IAddressObject>
                componentName={props.name !== undefined ? [props.name, "address"] : "address"}
                SingleWrapper={AddressWrapper}
                addText={"Neue Adresse hinzufügen"}
                label={getAddressLabel}
            />
        </>
    );
};

export default OrganizationWrapper;
