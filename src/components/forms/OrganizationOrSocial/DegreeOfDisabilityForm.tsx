import { BooleanPIO, CodePIO, IResponse, IntegerPIO, SubTree, UuidPIO } from "@thaias/pio_editor_meta";
import { Coding, SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form, FormInstance } from "antd";
import React, { useEffect, useState } from "react";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import {
    checkCoding,
    checkFormIsNotEmpty,
    checkMultipleCoding,
    clearSubTree,
    getAllUnsupportedCodings,
    writeCodingToSubTree,
    writeUnsupportedCodingsToSubTree,
} from "../../../services/HelperService";
import { helperTextDegreeOfDisabilityForm } from "../../../services/HelperTextService";
import PIOService from "../../../services/PIOService";
import { deleteChildrenFromSubTree } from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import InputDropDown from "../../basic/InputDropDown";

/**
 * This form contains information about the degree of disability. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Observation_Degree_Of_Disability (0..1)
 * - KBV_PR_MIO_ULB_Observation_Degree_Of_Disability_Available (1..1) -> 'present' & 'absent' case processed in backend, 'unknown' case processed in form
 *
 * PIO-Small:
 * - KBV_PR_MIO_ULB_Observation_Degree_Of_Disability.effective is not implemented
 * - KBV_PR_MIO_ULB_Observation_Degree_Of_Disability.performer is not implemented
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const DegreeOfDisabilityForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets
    const markValueSet: ValueSets = new ValueSets("http://fhir.de/ValueSet/merkzeichen-de");
    const markOptions: SelectOptions = markValueSet.getOptionsSync;
    const disabilityAvailableValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Disability_Degree_Presence_Status"
    );

    //Degree of Disability Options for Drop Down
    const degreeOfDisabilityOptions: SelectOptions = Array.from(
        { length: 10 },
        (_, i: number): SelectOption => ({
            value: (i * 10 + 10).toString(),
            label: (i * 10 + 10).toString() + "%",
        })
    );

    //Codes for resource KBV_PR_MIO_ULB_Observation_Degree_Of_Disability_Available
    const disabilityUnknownCode = "404684003:363713009=373068000,47429007=(21134002:363713009=272520006)";

    //Paths for SubTrees (without uuid)
    const disabilitySubTreePath = "KBV_PR_MIO_ULB_Observation_Degree_Of_Disability";
    const availableSubTreePath = "KBV_PR_MIO_ULB_Observation_Degree_Of_Disability_Available";

    //Uuids of resources
    const disabilityUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Observation_Degree_Of_Disability");
    const availableUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Observation_Degree_Of_Disability_Available");
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");

    //SubTree states
    const [disabilitySubTree, setDisabilitySubTree] = useState<SubTree>();
    const [availableSubTree, setAvailableSubTree] = useState<SubTree>();

    //Form hooks and watcher for "unknown" check box
    const form: FormInstance = props.form;
    const watchedFields = Form.useWatch([], form);
    const [required, setRequired] = useState<boolean>(false);
    const [disabledDegreeOfDisability, setDisabledDegreeOfDisability] = useState<boolean>(false);

    //'unknown' check box handling and required field handling
    useEffect((): void => {
        //Handle 'unknown' check box
        if (watchedFields && watchedFields.degreeOfDisability_unknown === "unknown") {
            form.setFieldsValue({ mark: undefined, degreeOfDisability: undefined });
            setRequired(false);
            setDisabledDegreeOfDisability(true);
            form.submit();
        } else {
            setDisabledDegreeOfDisability(false);
        }

        //Handle required flag
        if (checkFormIsNotEmpty(watchedFields)) {
            if (watchedFields.degreeOfDisability_unknown !== "unknown") setRequired(true);
        } else {
            setRequired(false);
            form.setFields([{ name: "degreeOfDisability", errors: [] }]);
        }
    }, [watchedFields]);

    //Validate field again, if required flag changes
    useEffect((): void => {
        if (!required) form.validateFields(["degreeOfDisability"]);
    }, [required]);

    /**
     * Function for writing degree of disability to input field.
     * @param {SubTree} subTree A subTree cut out from KBV_PR_MIO_ULB_Observation_Degree_Of_Disability resource
     */
    const setDegreeOfDisability = (subTree: SubTree): void => {
        const degree: string | undefined = subTree.getValueAsString();
        form.setFieldsValue({ degreeOfDisability: degree });
    };

    /**
     * Function for writing 'merkzeichen' to input field.
     * @param {SubTree} subTree A subTree cut out from KBV_PR_MIO_ULB_Observation_Degree_Of_Disability resource
     */
    const setMark = (subTree: SubTree): void => {
        let markArray: string[] = [];

        if (subTree.children.length > 0) {
            const doesMultipleMarkExist: boolean = subTree.children[0].lastPathElement.includes("component");
            markArray = (
                doesMultipleMarkExist
                    ? (checkMultipleCoding(subTree, "code.coding", markOptions) ?? [])
                    : [checkCoding(subTree, "code.coding", markOptions) ?? ""]
            ).filter((singleCode: string): boolean => singleCode !== "");
        }
        form.setFieldsValue({ mark: markArray });
    };

    /**
     * Function for setting 'unknown' check box.
     * @param {string | undefined} availabilityCode A code read from KBV_PR_MIO_ULB_Observation_Degree_Of_Disability_Availability resource
     */
    const setUnknown = (availabilityCode: string | undefined): void => {
        if (availabilityCode === disabilityUnknownCode) {
            form.setFieldsValue({
                degreeOfDisability: undefined,
                mark: undefined,
                degreeOfDisability_unknown: "unknown",
            });
        }
    };

    /** Initialize subTree states. Then read SubTree data and initialize input fields. */
    useEffect(() => {
        //Get relevant SubTrees from backend
        PIOService.getSubTrees([
            disabilityUUID + "." + disabilitySubTreePath,
            availableUUID + "." + availableSubTreePath,
        ]).then((result: IResponse): void => {
            if (result.success) {
                (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                    switch (subTree.absolutePath) {
                        case disabilityUUID + "." + disabilitySubTreePath:
                            //Initialize input fields
                            setDegreeOfDisability(subTree.getSubTreeByPath("valueInteger"));
                            setMark(subTree.getSubTreeByPath("component"));
                            //Set react state
                            setDisabilitySubTree(subTree);
                            return;
                        case availableUUID + "." + availableSubTreePath:
                            //Initialize unknown check box
                            setUnknown(subTree.getSubTreeByPath("valueCodeableConcept.coding.code").getValueAsString());
                            //Set react state
                            setAvailableSubTree(subTree);
                            return;
                        default:
                            return;
                    }
                });
            }
        });
    }, []);

    /**
     * Function saves the degree of disability to disabilitySubTree.
     * @param {IFormFinishObject} value Return object from Ant Design Form
     */
    const saveDegreeOfDisability = (value: IFormFinishObject): void => {
        if (value.degreeOfDisability) {
            disabilitySubTree?.setValue("valueInteger", new IntegerPIO(Number(value.degreeOfDisability)));
        } else {
            disabilitySubTree?.deleteSubTreeByPath("valueInteger");
        }
    };

    /**
     * Function saves the degree of disability to disabilitySubTree.
     * @param {IFormFinishObject} value Return object from Ant Design Form
     */
    const saveMark = (value: IFormFinishObject): void => {
        const unsupportedCodings: Coding[] | undefined = getAllUnsupportedCodings(
            value.mark as string[] | undefined,
            disabilitySubTree?.getSubTreeByPath("component") as SubTree,
            "code.coding",
            markValueSet
        );

        deleteChildrenFromSubTree(disabilitySubTree as SubTree, "component[");
        if (value.mark) {
            let index: number = 0;
            (value.mark as string[]).forEach((markCode: string) => {
                const coding: Coding | undefined = markValueSet.getObjectByCodeSync(markCode);
                const pathElement: string = "component[" + index + "]";
                if (coding) {
                    writeCodingToSubTree(disabilitySubTree as SubTree, pathElement + ".code.coding", coding);
                    disabilitySubTree?.setValue(pathElement + ".valueBoolean", new BooleanPIO(true));
                    index++;
                }
            });
        }

        writeUnsupportedCodingsToSubTree(disabilitySubTree as SubTree, "component", "code.coding", unsupportedCodings);
    };

    /**
     * Writes all fixed values to disabilitySubTree. If no data are present in 'value' -> fixed values are deleted.
     * @param {IFormFinishObject} value Return object from Ant Design Form
     */
    const writeFixedValues = (value: IFormFinishObject): void => {
        if (value.degreeOfDisability || (Array.isArray(value.mark) && value.mark.length > 0)) {
            disabilitySubTree?.setValue("status", new CodePIO("final"));
            writeCodingToSubTree(disabilitySubTree as SubTree, "code.coding", {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "116149007",
                display: "Disability percentage (finding)",
            } as Coding);
            disabilitySubTree?.setValue("subject.reference", new UuidPIO(patientUUID));
        } else {
            disabilitySubTree?.deleteSubTreeByPath("status");
            disabilitySubTree?.deleteSubTreeByPath("code");
            disabilitySubTree?.deleteSubTreeByPath("subject");
        }
    };

    /**
     * Creates the mandatory KBV_PR_MIO_ULB_Observation_Degree_Of_Disability_Available resource in case of 'unknown'.
     * Case 'present' & 'absent' is handled in backend.
     * @param {IFormFinishObject} value Return object from Ant Design Form
     */
    const writeAvailableSubTree = (value: IFormFinishObject): void => {
        if (value.degreeOfDisability_unknown === "unknown") {
            //Write code to subTree
            const coding: Coding | undefined = disabilityAvailableValueSet.getObjectByCodeSync(disabilityUnknownCode);
            writeCodingToSubTree(availableSubTree as SubTree, "valueCodeableConcept.coding", coding);
            //Write fixed values to subTree
            availableSubTree?.setValue("status", new CodePIO("final"));
            writeCodingToSubTree(availableSubTree as SubTree, "code.coding", {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "363787002:704326004=(404684003:363713009=260411009,47429007=(21134002:363713009=272520006))",
                display:
                    "Observable entity (observable entity) : Precondition (attribute) = ( Clinical finding (finding) : Has interpretation (attribute) = Presence findings (qualifier value) , Associated with (attribute) = ( Disability (finding) : Has interpretation (attribute) = Degree findings (qualifier value) ) )",
            } as Coding);
            availableSubTree?.setValue("subject.reference", new UuidPIO(patientUUID));
        } else {
            //Delete whole availableSubTree
            clearSubTree(availableSubTree as SubTree);
        }
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        saveDegreeOfDisability(value);
        saveMark(value);
        writeFixedValues(value);
        writeAvailableSubTree(value);

        //Sending disabilitySubTree to backend
        PIOService.saveSubTrees([disabilitySubTree as SubTree, availableSubTree as SubTree]).then(
            (result: IResponse): void => {
                if (!result.success) console.warn(result.message);
            }
        );
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"DegreeOfDisabilityForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            label={"Behinderungsgrad"}
                            name={"degreeOfDisability"}
                            options={degreeOfDisabilityOptions}
                            placeholder={"Behinderungsgrad wählen"}
                            unknownCheckboxName={"degreeOfDisability_unknown"}
                            unknownCheckboxValue={"unknown"}
                            wide={false}
                            rules={[{ required: required, message: "Bitte wählen Sie einen Behinderungsgrad aus!" }]}
                        />
                    </div>
                    <div className={"right"}>
                        <InputDropDown
                            label={"Merkzeichen"}
                            name={"mark"}
                            options={markOptions}
                            multiple={true}
                            placeholder={"Merkzeichen wählen"}
                            disabled={disabledDegreeOfDisability}
                            helpText={helperTextDegreeOfDisabilityForm.mark}
                        />
                    </div>
                </div>
            </Form>
        </div>
    );
};

export default DegreeOfDisabilityForm;
