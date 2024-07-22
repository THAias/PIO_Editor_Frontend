import { IContactPersonObject, IResponse, SubTree, UriPIO, UuidPIO } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
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
import { ContactPersonWrapper } from "../../wrappers/ContactPersonWrapper";

/**
 * This form contains information about legal care. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Observation_Information_Legal_Care
 *
 * PIO-Small exclusions:
 * - performer
 * - effective
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const LegalCareForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets and Options
    const legalCareValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Information_Legal_Guardian"
    );
    const legalCareOptions = {
        present:
            "243796009:{408732007=58626002}{246090004=(404684003:47429007=419891008)}{246090004=(310385006:363713009=52101004)}",
        absent: "243796009:{408732007=58626002}{246090004=(404684003:47429007=419891008)}{246090004=(310385006:363713009=2667000)}",
        undetermined:
            "243796009:{408732007=58626002}{246090004=(404684003:47429007=419891008)}{246090004=(310385006:363713009=373068000)}",
    };
    // UUIDs and paths
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const legalCarePath: string = "KBV_PR_MIO_ULB_Observation_Information_Legal_Care";
    const legalCareUUID: string = UUIDService.getUUID(legalCarePath);

    // States
    const [legalCareSubTree, setLegalCareSubTree] = useState<SubTree>();
    const form = props.form;
    const [modalOpen, setModalOpen] = React.useState<boolean>(false);

    const dispatch: AppDispatch = useDispatch();
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

    const formSelectContactPerson: string[] = Form.useWatch("legalCare", form);

    /**
     * Requests SubTrees from backend and initializes input fields.
     * @param {boolean} setReactStates When true, requested subTrees will be written to react state
     */
    const initializeInputFields = (setReactStates: boolean): void => {
        PIOService.getSubTrees([`${legalCareUUID}.${legalCarePath}`]).then((result: IResponse): void => {
            if (!result.success || !result.data) return;
            const subTree = (result.data.subTrees as SubTree[])[0];
            if (setReactStates) setLegalCareSubTree(subTree);
            // Setting fields
            const entries: string[] = [];
            const contacts: SubTree[] = subTree.getSubTreeByPath("extension").children;
            if (contacts && contacts.length > 0) {
                contacts.forEach((extension: SubTree): void => {
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
                form.setFieldValue("legalCare", entries);
            } else if (
                subTree.getSubTreeByPath("valueCodeableConcept.coding.code").getValueAsString() ===
                legalCareOptions.undetermined
            )
                form.setFieldValue("legalCare_unknown", "unknown");
        });
    };

    /** Initialize SubTrees and write existing values to Form fields */
    useEffect((): void => {
        initializeInputFields(true);
    }, []);

    /** Separate useEffect() for redux handling. Initializes input fields without setting react states. */
    useEffect((): void => {
        initializeInputFields(false);
    }, [contactPersonReduxState]);

    /** Opens the modal if the "addContactPerson" value is selected in the form. */
    useEffect(() => {
        if (formSelectContactPerson?.includes("addContactPerson")) {
            setModalOpen(true);
        }
    }, [formSelectContactPerson]);

    const writeExtensions = (subTree: SubTree, entries: string[]): void => {
        entries.forEach((entry: string, index: number): void => {
            if (entry && validate(entry)) {
                subTree.setValue(`extension[${index}]`, UriPIO.parseFromString(extensionUrls.contactPersons));
                subTree.setValue(`extension[${index}].valueReference.reference`, UuidPIO.parseFromString(entry));
            }
        });
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        legalCareSubTree?.deleteSubTreeByPath("");
        let code: string;
        if (value.legalCare) {
            const contactPersonIds: string[] = value.legalCare as string[];
            writeExtensions(legalCareSubTree as SubTree, contactPersonIds);
            code = legalCareOptions.present;
        } else if (value.legalCare_unknown) code = legalCareOptions.undetermined;
        else code = legalCareOptions.absent;
        writeCodingToSubTree(
            legalCareSubTree as SubTree,
            "valueCodeableConcept.coding",
            legalCareValueSet.getObjectByCodeSync(code)
        );
        writeStaticFields(
            legalCareSubTree as SubTree,
            patientUUID,
            {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "363787002:704319004=58626002,704325000=419891008",
                display:
                    "Observable entity (observable entity) : Inheres in (attribute) = Legal guardian (person) , Relative to (attribute) = Record artifact (record artifact)",
            },
            true
        );

        PIOService.saveSubTrees([legalCareSubTree as SubTree]).then((result: IResponse): void => {
            if (!result.success) console.error(result);
        });
    };

    /**
     * Saves the new contact person to the redux store and updates the form.
     * @param {IContactPersonObject} contactPersonObject Object with the contact person data
     */
    const saveNewContactPerson = (contactPersonObject: IContactPersonObject): void => {
        setModalOpen(false);
        dispatch(contactPersonActions.addContactPersonRedux(contactPersonObject));
        const temp: string[] = [...formSelectContactPerson];
        const indexToReplace: number = temp.indexOf("addContactPerson");
        temp[indexToReplace.valueOf()] = contactPersonObject.id;
        form.setFieldValue("legalCare", temp);
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"LegalCareForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            multiple={true}
                            name={"legalCare"}
                            label={"Kontaktperson/en für gesetzliche Betreuung"}
                            placeholder={"Kontaktperson/en wählen"}
                            options={contactPersonsOptions}
                            searchable={true}
                            unknownCheckboxName={"legalCare_unknown"}
                            unknownCheckboxValue={"unknown"}
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
                        const temp: string[] = [...formSelectContactPerson];
                        const indexToRemove: number = temp.indexOf("addContactPerson");
                        temp.splice(indexToRemove, 1);
                        form.setFieldValue("legalCare", temp);
                    }}
                    onOK={saveNewContactPerson}
                />
            )}
        </div>
    );
};

export default LegalCareForm;
