import {
    CodePIO,
    IContactPersonObject,
    ILocationObject,
    IOrganizationObject,
    IResponse,
    SubTree,
    UuidPIO,
} from "@thaias/pio_editor_meta";
import { Coding, SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { validate } from "uuid";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { AppDispatch, RootState } from "../../../@types/ReduxTypes";
import contactPersonActions from "../../../redux/actions/ContactPersonActions";
import organizationActions from "../../../redux/actions/OrganizationActions";
import AddressBookService from "../../../services/AddressBookService";
import { checkCoding, clearSubTree, getNameLabel, writeCodingToSubTree } from "../../../services/HelperService";
import { helperTextPatientLocationForm } from "../../../services/HelperTextService";
import PIOService from "../../../services/PIOService";
import { getUuidFromValue } from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import CustomModal from "../../basic/CustomModal";
import InputDropDown from "../../basic/InputDropDown";
import { ContactPersonWrapper } from "../../wrappers/ContactPersonWrapper";
import OrganizationWrapper from "../../wrappers/OrganizationWrapper";

/**
 * This form contains general information about the patient's current location:
 * - KBV_PR_MIO_ULB_Encounter_Current_Location
 * - KBV_PR_MIO_ULB_Encounter_Current_Location.participant -> contact person
 * - KBV_PR_MIO_ULB_Encounter_Current_Location.class -> residence
 * - KBV_PR_MIO_ULB_Encounter_Current_Location.type -> living condition
 * - KBV_PR_MIO_ULB_Encounter_Current_Location.type.text -> living condition text
 *
 * - KBV_VS_MIO_ULB_Residence_Status
 * - KBV_PR_MIO_ULB_Patient_Contact_Person
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const PatientLocationForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets
    const patientResidenceValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Residence_Status"
    );
    const patientResidenceOptions: SelectOptions = patientResidenceValueSet.getOptionsSync;
    const patientLivingConditionValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Living_Condition"
    );
    const patientLivingConditionOptions: SelectOptions = patientLivingConditionValueSet.getOptionsSync;
    const participantCoding: Coding = {
        system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
        version: "3.0.0",
        code: "CALLBCK",
        display: "callback contact",
    };
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

    const organizationReduxState: IOrganizationObject[] = useSelector((state: RootState) => state.organizationState);

    const organizationOptions: SelectOptions = [
        { label: "Neue Einrichtung hinzufügen", value: "organizationValue" },
        ...organizationReduxState.map((org: IOrganizationObject): SelectOption => ({ label: org.name, value: org.id })),
    ];

    //SubTree path, UUID
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const locationSubTreePath = "KBV_PR_MIO_ULB_Encounter_Current_Location";
    const locationUUID: string = UUIDService.getUUID(locationSubTreePath);
    const locationAbsolutePath: string = locationUUID + "." + locationSubTreePath;

    //States
    const [locationSubTree, setLocationSubTree] = useState<SubTree>();
    const [contactModalOpen, setContactModalOpen] = useState<boolean>(false);
    const [organizationModalOpen, setOrganizationModalOpen] = useState<boolean>(false);
    const [required, setRequired] = useState<boolean>(false);

    const form = props.form;

    const residenceValue = Form.useWatch("class", form);
    const participantValue = Form.useWatch("participant", form);
    const organizationValue = Form.useWatch("serviceProvider", form);

    const typeValue = Form.useWatch("type", form);

    //Redux
    const dispatch: AppDispatch = useDispatch();

    /**
     * Helper function to set initial values of form fields and subtree state
     * @param {SubTree} subTree location subtree holding information about all fields in this form
     */
    const setLocationFormValues = (subTree: SubTree): void => {
        const locationFormObject: ILocationObject = {
            class: undefined,
            type: undefined,
            participant: undefined,
            serviceProvider: undefined,
        };
        subTree.children.forEach((child: SubTree): void => {
            switch (child.lastPathElement) {
                case "class":
                    locationFormObject.class = checkCoding(child, "", patientResidenceOptions);
                    break;
                case "type":
                    locationFormObject.type = checkCoding(child, "coding", patientLivingConditionOptions);
                    break;
                case "participant":
                    locationFormObject.participant =
                        getUuidFromValue(child.getSubTreeByPath("individual.reference").getValueAsString()) ?? "";
                    break;
                case "serviceProvider":
                    locationFormObject.serviceProvider =
                        getUuidFromValue(child.getSubTreeByPath("reference").getValueAsString()) ?? "";
                    break;
                default:
                    break;
            }
        });
        form.setFieldsValue(locationFormObject);
        setLocationSubTree(subTree);
    };

    useEffect((): void => {
        if (residenceValue !== "Anderer_Aufenthaltsort") form.setFieldValue("serviceProvider", undefined);
        if (residenceValue !== "Aufenthalt_bei_Kontaktperson") form.setFieldValue("participant", undefined);
    }, [residenceValue]);

    //Required field handling
    useEffect((): void => {
        if (typeValue != null) setRequired(true);
        else {
            setRequired(false);
            form.setFields([{ name: "class", errors: [] }]);
        }
    }, [typeValue]);

    //Validate field again, if required flag changes
    useEffect((): void => {
        if (!required) form.validateFields(["class"]);
    }, [required]);

    //Initial hook for retrieving SubTree from backend
    useEffect((): void => {
        //Get SubTrees from Backend
        PIOService.getSubTrees([locationAbsolutePath]).then((result: IResponse): void => {
            if (result.success) {
                (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                    if (subTree.absolutePath === locationAbsolutePath) setLocationFormValues(subTree);
                });
            }
        });
        //Setup contact persons for dropdown
    }, []);

    // Hook to open modal for new contact person
    useEffect((): void => {
        if (participantValue === "addContactPerson") setContactModalOpen(true);
        if (organizationValue === "organizationValue") setOrganizationModalOpen(true);
    }, [participantValue, organizationValue]);

    //Helper function to save existing fixed values in SubTree in onFinish function
    const saveFixedValues = (): void => {
        locationSubTree?.setValue("subject.reference", UuidPIO.parseFromString(patientUUID));
        locationSubTree?.setValue("status", CodePIO.parseFromString("finished"));
    };

    //Helper function to delete missing fixed values in SubTree in onFinish function
    const deleteFixedValues = (): void => {
        locationSubTree?.deleteSubTreeByPath("subject");
        locationSubTree?.deleteValue("status");
    };

    //Helper function for class property of SubTree
    const saveResidence = (value: IFormFinishObject): void => {
        const residenceCoding: Coding | undefined = patientResidenceValueSet.getObjectByCodeSync(value.class as string);
        writeCodingToSubTree(locationSubTree as SubTree, "class", residenceCoding);
    };

    //Helper function for type property of SubTree
    const saveLivingCondition = (value: IFormFinishObject): void => {
        const livingConditionCoding: Coding | undefined = patientLivingConditionValueSet.getObjectByCodeSync(
            value.type as string
        );
        writeCodingToSubTree(locationSubTree as SubTree, "type.coding", livingConditionCoding);
    };

    //Helper function for participant (ContactPerson) of SubTree
    const saveContactPerson = (value: IFormFinishObject): void => {
        if (value.participant && validate(value.participant as string)) {
            writeCodingToSubTree(locationSubTree as SubTree, "participant.type.coding", participantCoding);
            locationSubTree?.setValue(
                "participant.individual.reference",
                UuidPIO.parseFromString(value.participant as string)
            );
        }
    };

    //Helper function for serviceProvider (Organization) of SubTree
    const saveOrganization = (value: IFormFinishObject): void => {
        if (value.serviceProvider && validate(value.serviceProvider as string))
            locationSubTree?.setValue(
                "serviceProvider.reference",
                UuidPIO.parseFromString(value.serviceProvider as string)
            );
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} values Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (values: IFormFinishObject): void => {
        const subTree: SubTree = locationSubTree as SubTree;
        //Handle fixed values
        const anyValues: string[] = Object.keys(values).filter(
            (key: string): boolean => values[key.toString()] !== undefined
        );
        if (anyValues.length > 0) saveFixedValues();
        else deleteFixedValues();

        const fields: string[] = ["class", "type", "participant", "serviceProvider"];
        fields.forEach((field: string): void => {
            if (values[field.toString()]) {
                switch (field) {
                    case "class":
                        saveResidence(values);
                        break;
                    case "type":
                        saveLivingCondition(values);
                        break;
                    case "participant":
                        saveContactPerson(values);
                        break;
                    case "serviceProvider":
                        saveOrganization(values);
                        break;
                    default:
                        break;
                }
            } else clearSubTree(subTree.getSubTreeByPath(field));
        });

        PIOService.saveSubTrees([locationSubTree as SubTree]).then((result: IResponse): void => {
            if (!result.success) {
                console.debug(result);
            }
        });
    };

    const saveNewContactPerson = (contactPersonObject: IContactPersonObject): void => {
        setContactModalOpen(false);
        dispatch(contactPersonActions.addContactPersonRedux(contactPersonObject));
        form.setFieldValue("participant", contactPersonObject.id);
    };

    //Helper for saving new organization and setting necessary field values/closing the modal
    const saveNewOrganization = (organizationObject: IOrganizationObject): void => {
        //Close Modal and save new organization to address book
        setOrganizationModalOpen(false);
        AddressBookService.addAddressBookItem(organizationObject).then((result: IResponse): void => {
            if (result.success) {
                dispatch(organizationActions.addOrganizationRedux(organizationObject));
                form.setFieldValue("serviceProvider", organizationObject.id);
            }
        });
    };

    return (
        <div onBlur={form.submit}>
            <Form form={form} onFinish={onFinish} name={"PatientLocationForm"} layout={"vertical"}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            name={"class"}
                            label={"Aktueller Aufenthalt"}
                            placeholder={"Aufenthalt wählen"}
                            options={patientResidenceOptions}
                            rules={[{ required: required, message: "Bitte wählen Sie einen Aufenthaltsort aus." }]}
                            helpText={helperTextPatientLocationForm.class}
                        />
                    </div>
                    <div className={"right"}>
                        {residenceValue === "Aufenthalt_bei_Kontaktperson" && (
                            <InputDropDown
                                name={"participant"}
                                label={"Kontaktperson"}
                                placeholder={"Kontaktperson"}
                                options={contactPersonsOptions}
                            />
                        )}
                        {residenceValue === "Anderer_Aufenthaltsort" && (
                            <InputDropDown
                                name={"serviceProvider"}
                                label={"Einrichtung"}
                                placeholder={"Einrichtung wählen"}
                                options={organizationOptions}
                            />
                        )}
                    </div>
                    {contactModalOpen && (
                        <CustomModal<IContactPersonObject>
                            content={<ContactPersonWrapper />}
                            label={"Neue Kontaktperson hinzufügen"}
                            open={contactModalOpen}
                            onOK={saveNewContactPerson}
                            onCancel={(): void => {
                                setContactModalOpen(false);
                                form.setFieldValue("participant", undefined);
                            }}
                        />
                    )}
                    {organizationModalOpen && (
                        <CustomModal<IOrganizationObject>
                            content={<OrganizationWrapper />}
                            label={"Neue Einrichtung hinzufügen"}
                            open={organizationModalOpen}
                            onOK={saveNewOrganization}
                            onCancel={(): void => {
                                form.setFieldValue("serviceProvider", undefined);
                                setOrganizationModalOpen(false);
                            }}
                        />
                    )}
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            name={"type"}
                            label={"Wohnverhältnis"}
                            placeholder={"Wohnverhältnis wählen"}
                            options={patientLivingConditionOptions}
                            helpText={helperTextPatientLocationForm.type}
                        />
                    </div>
                </div>
            </Form>
        </div>
    );
};

export default PatientLocationForm;
