import { IContactPersonObject, IResponse, MarkdownPIO, SubTree, UriPIO, UuidPIO } from "@thaias/pio_editor_meta";
import { Coding, SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { validate } from "uuid";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { AppDispatch, RootState } from "../../../@types/ReduxTypes";
import contactPersonActions from "../../../redux/actions/ContactPersonActions";
import { getNameLabel, writeCodingToSubTree } from "../../../services/HelperService";
import PIOService from "../../../services/PIOService";
import { extensionUrls, getUuidFromValue, writeStaticFields } from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import CustomModal from "../../basic/CustomModal";
import InputDropDown from "../../basic/InputDropDown";
import InputTextArea from "../../basic/InputTextArea";
import { ContactPersonWrapper } from "../../wrappers/ContactPersonWrapper";

/**
 * This form contains information about relatives. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Observation_Care_By_Relatives
 * - KBV_PR_MIO_ULB_Observation_Relatives_Notified
 *
 * PIO-Small:
 * - xxx
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const InfoAboutRelativesForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets and Options
    const careByRelativesValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Relatives_Involvement"
    );
    const relativesNotifiedValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Relatives_Notification_Status"
    );
    // UUIDs and Paths
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const careByRelativesPath: string = "KBV_PR_MIO_ULB_Observation_Care_By_Relatives";
    const careByRelativesUUID: string = UUIDService.getUUID(careByRelativesPath);
    const relativesNotifiedPath: string = "KBV_PR_MIO_ULB_Observation_Relatives_Notified";
    const relativesNotifiedUUID: string = UUIDService.getUUID(relativesNotifiedPath);

    // States
    const [careByRelativesSubTree, setCareByRelativesSubTree] = React.useState<SubTree>();
    const [relativesNotifiedSubTree, setRelativesNotifiedSubTree] = React.useState<SubTree>();
    const form = props.form;
    const [modalOpen, setModalOpen] = React.useState<boolean>(false);
    const [selectField, setSelectField] = useState<string>("");
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
    const dispatch: AppDispatch = useDispatch();

    const formSelectCareByRelatives: string[] = Form.useWatch("careByRelatives", form);
    const formSelectRelativesNotified: string[] = Form.useWatch("relativesNotified", form);

    /**
     * Writes the selected contact persons to the form field and checks the unknown checkbox if necessary.
     * @param {SubTree} subTree SubTree to get the extensions from
     * @param {string} fieldName Name of the form field to write the selected contact persons to
     * @param {string} unknownField Name of the form field to write the unknown checkbox value to
     * @param {string} unknownCode Code of the unknown value
     */
    const setFields = (subTree: SubTree, fieldName: string, unknownField: string, unknownCode: string): void => {
        const entries: string[] = [];
        subTree.getSubTreeByPath("extension").children.forEach((extension: SubTree): void => {
            contactPersonReduxState.forEach((contactPerson: IContactPersonObject): void => {
                if (
                    contactPerson.id ===
                    getUuidFromValue(
                        extension.getSubTreeByPath("valueReference.reference").getValueAsString() as string
                    )
                )
                    entries.push(contactPerson.id);
            });
        });
        form.setFieldValue(fieldName, entries);
        if (
            entries.length === 0 &&
            subTree.getSubTreeByPath("valueCodeableConcept.coding.code").getValueAsString() === unknownCode
        )
            form.setFieldValue(unknownField, "unknown");
    };

    /** Initializes input fields. */
    const initializeInputFields = (): void => {
        //Read careByRelativesSubTree
        form.setFieldValue(
            "comment",
            (careByRelativesSubTree as SubTree).getSubTreeByPath("note.text")?.getValueAsString()
        );
        setFields(
            careByRelativesSubTree as SubTree,
            "careByRelatives",
            "relative_unknown",
            "406546002:363713009=373068000"
        );

        //Read relativesNotifiedSubTree
        setFields(
            relativesNotifiedSubTree as SubTree,
            "relativesNotified",
            "relativesNotified_unknown",
            "129125009:{408731000=410512000,408730004=410537005,363589002=185087000,408732007=444148008}"
        );
    };

    /** Requests subTrees from backend and stores them in react states. */
    const initializeSubTrees = (): void => {
        PIOService.getSubTrees([
            `${careByRelativesUUID}.${careByRelativesPath}`,
            `${relativesNotifiedUUID}.${relativesNotifiedPath}`,
        ]).then((result: IResponse): void => {
            if (!result.success || !result.data) return;
            (result.data.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                if (subTree.lastPathElement === careByRelativesPath) {
                    setCareByRelativesSubTree(subTree);
                } else {
                    setRelativesNotifiedSubTree(subTree);
                }
            });
        });
    };

    /** Initialize SubTrees when component gets mounted. */
    useEffect((): void => {
        initializeSubTrees();
    }, []);

    /** Separate useEffect() for initializing input fields when all required data are present. */
    useEffect((): void => {
        if (contactPersonReduxState && careByRelativesSubTree && relativesNotifiedSubTree) initializeInputFields();
    }, [contactPersonReduxState, careByRelativesSubTree, relativesNotifiedSubTree]);

    /**
     * Opens the modal if the "addContactPerson" value is selected in the form.
     */
    useEffect((): void => {
        if (formSelectCareByRelatives?.includes("addContactPerson")) {
            setSelectField("careByRelatives");
            setModalOpen(true);
        } else if (formSelectRelativesNotified?.includes("addContactPerson")) {
            setSelectField("relativesNotified");
            setModalOpen(true);
        }
    }, [formSelectCareByRelatives, formSelectRelativesNotified]);

    /**
     * Writes selected contact persons as extensions to the SubTree.
     * @param {SubTree} subTree SubTree to write the extensions to
     * @param {string} entries UUIDs of the selected contact persons
     */
    const writeExtensions = (subTree: SubTree, entries: string[]): void => {
        entries.forEach((entry: string, index: number): void => {
            if (entry && validate(entry)) {
                subTree.setValue(`extension[${index}]`, UriPIO.parseFromString(extensionUrls.contactPersons));
                subTree.setValue(`extension[${index}].valueReference.reference`, UuidPIO.parseFromString(entry));
            }
        });
    };

    /**
     * Saves the data from the input fields and general values to the SubTree.
     * @param {SubTree} subTree SubTree to save the data to
     * @param {string[]} categoryValues Array of selected values
     * @param {string} unknownFlag Flag if the unknown checkbox is checked
     * @param {ValueSets} valueSet ValueSet to get the code from
     * @param {string} code Code of the selected value
     * @param {string} codeUnknown Code of the unknown value
     * @param {Coding | undefined} staticCoding Static Coding to write to the SubTree
     */
    const saveSubTree = (
        subTree: SubTree | undefined,
        categoryValues: string[] | undefined,
        unknownFlag: string | undefined,
        valueSet: ValueSets,
        code: string,
        codeUnknown: string,
        staticCoding: Coding | undefined
    ): void => {
        subTree?.deleteSubTreeByPath("");
        if (categoryValues && categoryValues.length > 0) {
            writeExtensions(subTree as SubTree, categoryValues);
            writeCodingToSubTree(subTree as SubTree, "valueCodeableConcept.coding", valueSet.getObjectByCodeSync(code));
        } else if (unknownFlag) {
            writeCodingToSubTree(
                subTree as SubTree,
                "valueCodeableConcept.coding",
                valueSet.getObjectByCodeSync(codeUnknown)
            );
        }
        if ((categoryValues && categoryValues.length > 0) || unknownFlag)
            writeStaticFields(subTree as SubTree, patientUUID, staticCoding, true);
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        const relatives: string[] = value.careByRelatives as string[];
        saveSubTree(
            careByRelativesSubTree as SubTree,
            relatives,
            value.relative_unknown as string,
            careByRelativesValueSet,
            "406546002",
            "406546002:363713009=373068000",
            {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "405204003",
                display: "Family involvement behavior: health care (observable entity)",
            }
        );
        saveSubTree(
            relativesNotifiedSubTree as SubTree,
            value.relativesNotified as string[],
            value.relativesNotified_unknown as string,
            relativesNotifiedValueSet,
            "418404007",
            "129125009:{408731000=410512000,408730004=410537005,363589002=185087000,408732007=444148008}",
            {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "302160007:704321009=(185087000:370131001=35359004)",
                display:
                    "Household, family and support network detail (observable entity) : Characterizes (attribute) = ( Notifications (procedure) : Recipient category (attribute) = Family (social concept) )",
            }
        );

        if (((relatives && relatives.length > 0) || value.relative_unknown) && value.comment)
            careByRelativesSubTree?.setValue("note.text", MarkdownPIO.parseFromString(value.comment as string));

        PIOService.saveSubTrees([careByRelativesSubTree as SubTree, relativesNotifiedSubTree as SubTree]).then(
            (result: IResponse): void => {
                if (!result.success) console.error("Error while saving SubTrees", result.message);
            }
        );
    };

    const saveNewContactPerson = (contactPersonObject: IContactPersonObject): void => {
        setModalOpen(false);
        if (selectField === "") return;
        dispatch(contactPersonActions.addContactPersonRedux(contactPersonObject));
        const temp: string[] =
            selectField === "careByRelatives" ? [...formSelectCareByRelatives] : [...formSelectRelativesNotified];
        const indexToReplace: number = temp.indexOf("addContactPerson");
        temp[indexToReplace.valueOf()] = contactPersonObject.id;
        form.setFieldValue(selectField, temp);
        setSelectField("");
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"InfoAboutRelativesForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            name={"careByRelatives"}
                            label={"Möglichkeit der Pflege durch An- oder Zugehörige"}
                            placeholder={"Kontaktpersonen wählen"}
                            options={contactPersonsOptions}
                            multiple={true}
                            unknownCheckboxName={"relative_unknown"}
                            unknownCheckboxValue={"unknown"}
                        />
                    </div>
                    <div className={"right"}>
                        <InputDropDown
                            name={"relativesNotified"}
                            label={"Benachrichtigung erfolgt?"}
                            placeholder={"Kontaktpersonen wählen"}
                            options={contactPersonsOptions}
                            multiple={true}
                            searchable={true}
                            unknownCheckboxName={"relativesNotified_unknown"}
                            unknownCheckboxValue={"unknown"}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputTextArea
                            name={"comment"}
                            label={"Kommentar"}
                            placeholder={"Ggf. Ergänzungen zur Pflege durch An- und Zugehörige... "}
                        />
                    </div>
                </div>
            </Form>
            {modalOpen && (
                <CustomModal<IContactPersonObject>
                    label={"Neue Kontaktperson hinzufügen"}
                    content={<ContactPersonWrapper />}
                    open={modalOpen}
                    onCancel={() => {
                        setModalOpen(false);
                        // Remove the "addContactPerson" value from the form field if the modal is dismissed
                        const temp: string[] =
                            selectField === "careByRelatives"
                                ? [...formSelectCareByRelatives]
                                : [...formSelectRelativesNotified];
                        const indexToRemove: number = temp.indexOf("addContactPerson");
                        temp.splice(indexToRemove, 1);
                        form.setFieldValue(selectField, temp);
                        setSelectField("");
                    }}
                    onOK={saveNewContactPerson}
                />
            )}
        </div>
    );
};

export default InfoAboutRelativesForm;
