import { IDeviceObject, IOrganizationObject } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Checkbox, Form, FormInstance } from "antd";
import { CheckboxChangeEvent } from "antd/es/checkbox";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { v4 } from "uuid";

import { ISingleWrapperProps } from "../../@types/FormTypes";
import { AppDispatch, RootState } from "../../@types/ReduxTypes";
import organizationActions from "../../redux/actions/OrganizationActions";
import { getFullPath } from "../../services/HelperService";
import { helperTextDeviceForm } from "../../services/HelperTextService";
import ValueSets from "../../services/ValueSetService";
import AddButton from "../basic/AddButton";
import CustomModal from "../basic/CustomModal";
import InputDropDown from "../basic/InputDropDown";
import InputTextField from "../basic/InputTextField";
import OrganizationWrapper from "./OrganizationWrapper";

const deviceTypeValueSet: ValueSets = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Device_SNOMED_CT");

/**
 * This form contains information about ONE devices. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Device
 *
 * PIO-Small:
 * - xxx
 * @param {ISingleWrapperProps} props ISingleWrapperProps props interface
 * @returns {React.JSX.Element} React element
 */
const DeviceWrapper = (props: ISingleWrapperProps): React.JSX.Element => {
    // ValueSets, Options, States, Redux setup
    const dispatch: AppDispatch = useDispatch();
    const deviceTypeOptions: SelectOptions = deviceTypeValueSet.getOptionsSync;
    const organizationReduxState: IOrganizationObject[] = useSelector((state: RootState) => state.organizationState);
    // DropDown options
    const organizationOptions: SelectOptions = [
        { label: "Neue Einrichtung hinzufügen", value: "newOrganization" },
        ...organizationReduxState.map((org: IOrganizationObject): SelectOption => ({ label: org.name, value: org.id })),
    ];
    const identifierOptions: { [key: string]: SelectOption } = {
        udiCarrier: { label: "UDI", value: "udiCarrier" },
        serialNumber: { label: "Seriennummer", value: "serialNumber" },
        modelNumber: { label: "Modellnummer", value: "modelNumber" },
    };
    const fullPath: string[] = getFullPath(props);
    const form: FormInstance = Form.useFormInstance();
    const newOrganization = Form.useWatch(fullPath.concat("deviceResponsibleOrganization"), form);
    const [identifiers, setIdentifiers] = useState<SelectOptions>([]);
    const [modalOpen, setModalOpen] = useState<boolean>(false);

    //Initial hook for setting identifiers
    useEffect((): void => {
        const tempIdentifiers: SelectOptions = [];
        const device: IDeviceObject = form.getFieldValue(fullPath);
        if (device) {
            if (device.udiCarrier !== undefined) tempIdentifiers.push(identifierOptions.udiCarrier);
            if (device.serialNumber !== undefined) tempIdentifiers.push(identifierOptions.serialNumber);
            if (device.modelNumber !== undefined) tempIdentifiers.push(identifierOptions.modelNumber);
        }
        setIdentifiers(tempIdentifiers);
    }, []);

    //Hook for opening modal
    useEffect((): void => {
        if (newOrganization === "newOrganization") setModalOpen(true);
    }, [newOrganization]);

    /**
     * Function for adding new input fields
     * @param {string} value - Name of the input field which should be added
     */
    const addIdentifierInfo = (value: string): void => {
        const newIdentifier: SelectOption = identifierOptions[value.toString()];
        setIdentifiers([...identifiers, newIdentifier]);
    };

    /**
     * Function for removing input fields
     * @param {string} label Name of the input field which should be removed
     */
    const removeIdentifierInfo = (label: string): void => {
        //Remove input field from list
        const newIdentifierOptions: SelectOptions = [];
        let deletedItem: SelectOption = { value: "", label: "" };
        identifiers.forEach((option: SelectOption): void => {
            if (option.label !== label) {
                newIdentifierOptions.push(option);
            } else {
                deletedItem = option;
            }
        });
        setIdentifiers(newIdentifierOptions);

        //Reset input field & submit form
        form.setFieldValue(
            props.name !== undefined ? [props.parentName, props.name, deletedItem.value] : deletedItem.value,
            undefined
        );
        form.submit();
    };

    /**
     * This function filters the options of the add button. Input fields which are already rendered should not be listed
     * in add button options.
     * @returns {SelectOptions} All options for the add button
     */
    const getAddButtonOptions = (): SelectOptions => {
        // return all identificationNumber selectOption which aren't already added
        return Object.values(identifierOptions).filter((option: SelectOption) => {
            return !identifiers.some(
                (identificationNumber: SelectOption): boolean => identificationNumber?.value === option?.value
            );
        });
    };

    //Helper for saving new organization
    const saveNewOrganization = (organization: IOrganizationObject): void => {
        setModalOpen(false);
        form.setFieldValue(fullPath.concat("deviceResponsibleOrganization"), {
            label: organization.name,
            value: organization.id,
        });
        dispatch(organizationActions.addOrganizationRedux(organization));
    };

    return (
        <>
            <Form.Item name={props.name !== undefined ? [props.name, "id"] : "id"} hidden={true} initialValue={v4()}>
                <div style={{ display: "hidden" }} />
            </Form.Item>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        label={"Gerätetyp"}
                        name={props.name !== undefined ? [props.name, "deviceType"] : "deviceType"}
                        options={deviceTypeOptions}
                        placeholder={"Gerätetyp wählen"}
                        searchable={true}
                        rules={[{ required: true, message: "Bitte Gerätetyp auswählen!" }]}
                    />
                    {identifiers.length < 3 && (
                        <AddButton
                            onChange={(label: string) => addIdentifierInfo(label)}
                            type={"furtherDeviceInfo"}
                            vertical={false}
                            options={getAddButtonOptions()}
                        />
                    )}
                </div>
                <div className={"right"}>
                    {identifiers.map(
                        (identifier: SelectOption): React.JSX.Element => (
                            <InputTextField
                                key={identifier.value}
                                name={props.name !== undefined ? [props.name, identifier.value] : identifier.value}
                                label={identifier.label}
                                placeholder={identifier.label + " eingeben ..."}
                                wide={false}
                                removable={true}
                                removeHandler={(label: string) => removeIdentifierInfo(label)}
                                helpText={identifier.value === "udiCarrier" ? helperTextDeviceForm.udi : undefined}
                            />
                        )
                    )}
                </div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputTextField
                        name={props.name !== undefined ? [props.name, "deviceName"] : "deviceName"}
                        placeholder={"Gerätename eingeben..."}
                        label={"Gerätename"}
                    />
                    <div className={"device-given-info"}>
                        <div className={"device-given-checkbox-and-label"}>
                            <div className={"device-given-checkbox"}>
                                <Form.Item
                                    name={props.name !== undefined ? [props.name, "given"] : "given"}
                                    valuePropName={"checked"}
                                    initialValue={false}
                                >
                                    <Checkbox
                                        defaultChecked={form.getFieldValue(
                                            props.name !== undefined ? [props.name, "given"] : "given"
                                        )}
                                        onChange={(event: CheckboxChangeEvent): void =>
                                            form.setFieldValue(
                                                props.name !== undefined ? [props.name, "given"] : "given",
                                                event.target.checked
                                            )
                                        }
                                    />
                                </Form.Item>
                            </div>
                            Mitgegeben
                        </div>
                    </div>
                </div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        label={"Verantwortliche Organisation"}
                        name={
                            props.name !== undefined
                                ? [props.name, "deviceResponsibleOrganization"]
                                : "deviceResponsibleOrganization"
                        }
                        options={organizationOptions}
                        placeholder={"Organisation wählen"}
                    />
                </div>
            </div>
            {modalOpen && (
                <CustomModal<IOrganizationObject>
                    label={"Neue Einrichtung hinzufügen"}
                    content={<OrganizationWrapper />}
                    open={modalOpen}
                    onOK={saveNewOrganization}
                    onCancel={(): void => {
                        setModalOpen(false);
                        form.setFieldValue(fullPath.concat("deviceResponsibleOrganization"), undefined);
                    }}
                />
            )}
        </>
    );
};

export default DeviceWrapper;
