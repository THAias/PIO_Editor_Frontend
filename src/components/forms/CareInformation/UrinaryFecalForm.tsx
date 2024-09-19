import { DateTimePIO, IResponse, MarkdownPIO, SubTree } from "@thaias/pio_editor_meta";
import { Coding, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import dayjs, { Dayjs } from "dayjs";
import React, { useEffect, useState } from "react";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import {
    checkCoding,
    convertDateJsToString,
    convertStringToDayJs,
    writeCodingToSubTree,
} from "../../../services/HelperService";
import { helperTextUrinaryFecalForm } from "../../../services/HelperTextService";
import PIOService from "../../../services/PIOService";
import { writeStaticFields } from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import InputDatePicker from "../../basic/InputDatePicker";
import InputDropDown from "../../basic/InputDropDown";
import InputTextArea from "../../basic/InputTextArea";

/**
 * This form contains information about Urinary and Fecal information. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Observation_Urinary_Continence_Differentiated_Assessment
 * - KBV_PR_MIO_ULB_Observation_Urinary_Drainage
 * - KBV_PR_MIO_ULB_Observation_Fecal_Continence_Differentiated_Assessment
 * - KBV_PR_MIO_ULB_Observation_Fecal_Drainage
 * - KBV_PR_MIO_ULB_Observation_Last_Bowel_Movement
 *
 * PIO-Small exclusions:
 * - KBV_PR_MIO_ULB_Observation_Urinary_Continence_Differentiated_Assessment
 *      - effectiveDateTime
 *      - performer.reference
 * - KBV_PR_MIO_ULB_Observation_Urinary_Drainage
 *      - extension:geraetnutzung
 *      - effectivePeriod
 *      - performer.reference
 *      - dataAbsentReason
 * - KBV_PR_MIO_ULB_Observation_Fecal_Continence_Differentiated_Assessment
 *      - effectiveDateTime
 *      - performer.reference
 * - KBV_PR_MIO_ULB_Observation_Fecal_Drainage
 *      - extension:geraetnutzung
 *      - effectivePeriod
 *      - performer.reference
 *      - dataAbsentReason
 * - KBV_PR_MIO_ULB_Observation_Last_Bowel_Movement
 *      - performer.reference
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const UrinaryFecalForm = (props: IFormProps): React.JSX.Element => {
    //Options and ValueSets
    const urinaryContinenceValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Bladder_Continence_Status"
    );
    const urinaryContinenceOptions: SelectOptions = urinaryContinenceValueSet.getOptionsSync;
    const urinaryDrainageValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Evacuation_Bladder_Content"
    );
    const urinaryDrainageOptions: SelectOptions = urinaryDrainageValueSet.getOptionsSync;
    const fecalContinenceValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Bowel_Continence_Status"
    );
    const fecalContinenceOptions: SelectOptions = fecalContinenceValueSet.getOptionsSync;
    const fecalDrainageValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Evacuation_Intestinal_Contents"
    );
    const fecalDrainageOptions: SelectOptions = fecalDrainageValueSet.getOptionsSync;

    //UUIDs
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const urinaryContinencePath: string = "KBV_PR_MIO_ULB_Observation_Urinary_Continence_Differentiated_Assessment";
    const urinaryContinenceUUID: string = UUIDService.getUUID(urinaryContinencePath);
    const urinaryDrainagePath: string = "KBV_PR_MIO_ULB_Observation_Urinary_Drainage";
    const urinaryDrainageUUID: string = UUIDService.getUUID(urinaryDrainagePath);
    const fecalContinencePath: string = "KBV_PR_MIO_ULB_Observation_Fecal_Continence_Differentiated_Assessment";
    const fecalContinenceUUID: string = UUIDService.getUUID(fecalContinencePath);
    const fecalDrainagePath: string = "KBV_PR_MIO_ULB_Observation_Fecal_Drainage";
    const fecalDrainageUUID: string = UUIDService.getUUID(fecalDrainagePath);
    const lastBowelMovementPath: string = "KBV_PR_MIO_ULB_Observation_Last_Bowel_Movement";
    const lastBowelMovementUUID: string = UUIDService.getUUID(lastBowelMovementPath);

    //States
    const [urinaryContinenceSubTree, setUrinaryContinenceSubTree] = useState<SubTree>();
    const [urinaryDrainageSubTree, setUrinaryDrainageSubTree] = useState<SubTree>();
    const [fecalContinenceSubTree, setFecalContinenceSubTree] = useState<SubTree>();
    const [fecalDrainageSubTree, setFecalDrainageSubTree] = useState<SubTree>();
    const [lastBowelMovementSubTree, setLastBowelMovementSubTree] = useState<SubTree>();
    const form = props.form;

    /**
     * Function for writing values to input fields with optional note.
     * @param {SubTree} subTree SubTree to get the values for the form
     * @param {string} fieldName The name of the field to set in the form
     * @param {boolean} hasNote Whether the field has a note or not
     */
    const setFields = (subTree: SubTree, fieldName: string, hasNote: boolean = false): void => {
        const options = (): SelectOptions => {
            switch (fieldName) {
                case "urinaryContinence":
                    return urinaryContinenceOptions;
                case "urinaryDrainage":
                    return urinaryDrainageOptions;
                case "fecalContinence":
                    return fecalContinenceOptions;
                case "fecalDrainage":
                    return fecalDrainageOptions;
                default:
                    return [] as SelectOptions;
            }
        };
        const value: string | undefined = checkCoding(subTree, "valueCodeableConcept.coding", options());
        const fieldValues: Record<string, string | undefined> = {
            [`${fieldName}Value`]: value,
        };
        if (hasNote) fieldValues[`${fieldName}Note`] = subTree.getSubTreeByPath("note.text")?.getValueAsString();
        form.setFieldsValue(fieldValues);
    };

    /**
     * Function for writing last bowel movement values to input fields.
     * @param {SubTree} subTree SubTree to get the values for the form
     */
    const setLastBowelMovementFields = (subTree: SubTree): void => {
        const lastBowelDateValue: string | undefined = subTree?.getSubTreeByPath("valueDateTime").getValueAsString();
        const lastBowelDate: dayjs.Dayjs | undefined = lastBowelDateValue
            ? convertStringToDayJs(lastBowelDateValue)
            : undefined;
        form.setFieldValue("lastBowelMovement", lastBowelDate);
    };

    /** Initialize SubTrees and write existing values to Form fields */
    useEffect((): void => {
        PIOService.getSubTrees([
            urinaryContinenceUUID + "." + urinaryContinencePath,
            urinaryDrainageUUID + "." + urinaryDrainagePath,
            fecalContinenceUUID + "." + fecalContinencePath,
            fecalDrainageUUID + "." + fecalDrainagePath,
            lastBowelMovementUUID + "." + lastBowelMovementPath,
        ]).then((result: IResponse): void => {
            if (result.success)
                (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                    switch (subTree.lastPathElement) {
                        case urinaryContinencePath:
                            setUrinaryContinenceSubTree(subTree);
                            setFields(subTree, "urinaryContinence");
                            break;
                        case urinaryDrainagePath:
                            setUrinaryDrainageSubTree(subTree);
                            setFields(subTree, "urinaryDrainage", true);
                            break;
                        case fecalContinencePath:
                            setFecalContinenceSubTree(subTree);
                            setFields(subTree, "fecalContinence");
                            break;
                        case fecalDrainagePath:
                            setFecalDrainageSubTree(subTree);
                            setFields(subTree, "fecalDrainage", true);
                            break;
                        case lastBowelMovementPath:
                            setLastBowelMovementSubTree(subTree);
                            setLastBowelMovementFields(subTree);
                            break;
                        default:
                            break;
                    }
                });
        });
    }, []);

    /**
     * Saves a SubTree (continence or drainage).
     * @param {SubTree} subTree The SubTree to save data into.
     * @param {IFormFinishObject} value The Form values to save into the SubTree
     * @param {string} propertyName The name of the property to save data into.
     * @param {Coding} staticCoding The coding for the 'valueCodeableConcept.coding' property.
     * @param {boolean} hasNote Whether the field has a note or not.
     */
    const saveSubTree = (
        subTree: SubTree,
        value: IFormFinishObject,
        propertyName: string,
        staticCoding?: Coding,
        hasNote: boolean = false
    ): void => {
        const tempCoding: Coding = {
            system: subTree.getSubTreeByPath("valueCodeableConcept.coding.system").getValueAsString(),
            version: subTree.getSubTreeByPath("valueCodeableConcept.coding.version").getValueAsString(),
            code: subTree.getSubTreeByPath("valueCodeableConcept.coding.code").getValueAsString(),
            display: subTree.getSubTreeByPath("valueCodeableConcept.coding.display").getValueAsString(),
        } as Coding;

        subTree?.deleteSubTreeByPath("");
        const valueExists: boolean =
            value[propertyName + "Value"] !== undefined && value[propertyName + "Value"] !== "";
        const noteExists: boolean =
            hasNote && value[propertyName + "Note"] !== undefined && value[propertyName + "Note"] !== "";
        if (valueExists) {
            // Only input values
            switch (propertyName) {
                case "urinaryContinence":
                    writeCodingToSubTree(
                        subTree,
                        "valueCodeableConcept.coding",
                        urinaryContinenceValueSet.getObjectByCodeSync(value[propertyName + "Value"] as string) ??
                            tempCoding
                    );
                    break;
                case "urinaryDrainage":
                    writeCodingToSubTree(
                        subTree,
                        "valueCodeableConcept.coding",
                        urinaryDrainageValueSet.getObjectByCodeSync(value[propertyName + "Value"] as string) ??
                            tempCoding
                    );
                    break;
                case "fecalContinence":
                    writeCodingToSubTree(
                        subTree,
                        "valueCodeableConcept.coding",
                        fecalContinenceValueSet.getObjectByCodeSync(value[propertyName + "Value"] as string) ??
                            tempCoding
                    );
                    break;
                case "fecalDrainage":
                    writeCodingToSubTree(
                        subTree,
                        "valueCodeableConcept.coding",
                        fecalDrainageValueSet.getObjectByCodeSync(value[propertyName + "Value"] as string) ?? tempCoding
                    );
                    break;
                default:
                    break;
            }
        }
        if (noteExists)
            subTree?.setValue("note.text", MarkdownPIO.parseFromString(value[propertyName + "Note"] as string));
        if (valueExists || noteExists)
            // General values
            writeStaticFields(subTree, patientUUID, staticCoding as Coding, true);
    };

    /**
     * Saves the last bowel movement SubTree.
     * @param {IFormFinishObject} value The Form values to save into the SubTree
     */
    const saveLastBowelMovementSubTree = (value: IFormFinishObject): void => {
        lastBowelMovementSubTree?.deleteSubTreeByPath("");
        if (value.lastBowelMovement !== undefined && value.lastBowelMovement !== null) {
            //Input value
            lastBowelMovementSubTree?.setValue(
                "valueDateTime",
                DateTimePIO.parseFromString(
                    value.lastBowelMovement && convertDateJsToString(value.lastBowelMovement as Dayjs)
                )
            );
            //General values
            writeStaticFields(
                lastBowelMovementSubTree as SubTree,
                patientUUID,
                {
                    system: "http://snomed.info/sct",
                    version: "http://snomed.info/sct/900000000000207008/version/20220331",
                    code: "364171004:370134009=57615005",
                    display:
                        "Defecation observable (observable entity) : Time aspect (attribute) = Definite time (qualifier value)",
                },
                true
            );
        }
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form. Sends SubTrees to backend.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        saveSubTree(urinaryContinenceSubTree as SubTree, value, "urinaryContinence", {
            system: "http://snomed.info/sct",
            version: "http://snomed.info/sct/900000000000207008/version/20220331",
            code: "129009001",
            display: "Bladder control, function (observable entity)",
        });
        saveSubTree(
            urinaryDrainageSubTree as SubTree,
            value,
            "urinaryDrainage",
            {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "406219008",
                display: "Urinary elimination status (observable entity)",
            },
            true
        );
        saveSubTree(fecalContinenceSubTree as SubTree, value, "fecalContinence", {
            system: "http://snomed.info/sct",
            version: "http://snomed.info/sct/900000000000207008/version/20220331",
            code: "16490003",
            display: "Anorectal continence, function (observable entity)",
        });
        saveSubTree(
            fecalDrainageSubTree as SubTree,
            value,
            "fecalDrainage",
            {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "363787002:704321009=266683002",
                display:
                    "Observable entity (observable entity) : Characterizes (attribute) = Evacuation of gastrointestinal tract contents (procedure)",
            },
            true
        );
        saveLastBowelMovementSubTree(value);

        PIOService.saveSubTrees([
            urinaryContinenceSubTree as SubTree,
            urinaryDrainageSubTree as SubTree,
            fecalContinenceSubTree as SubTree,
            fecalDrainageSubTree as SubTree,
            lastBowelMovementSubTree as SubTree,
        ]).then((result: IResponse): void => {
            if (!result) console.debug(result);
        });
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"UrinaryFecalForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            name={"urinaryContinenceValue"}
                            label={"Harnkontinenz"}
                            options={urinaryContinenceOptions}
                            placeholder={"Harnkontinenz wählen"}
                            helpText={helperTextUrinaryFecalForm.urinaryContinenceValue}
                        />
                    </div>
                    <div className={"right"}></div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            name={"urinaryDrainageValue"}
                            label={"Harnableitung"}
                            options={urinaryDrainageOptions}
                            placeholder={"Harnableitung wählen"}
                            helpText={helperTextUrinaryFecalForm.urinaryDrainageValue}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextArea
                            name={"urinaryDrainageNote"}
                            label={"Kommentar"}
                            placeholder={"Ggf. Ergänzungen zur Harnableitung..."}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            name={"fecalContinenceValue"}
                            label={"Stuhlkontinenz"}
                            options={fecalContinenceOptions}
                            placeholder={"Stuhlkontinenz wählen"}
                            helpText={helperTextUrinaryFecalForm.fecalContinenceValue}
                        />
                    </div>
                    <div className={"right"}></div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            name={"fecalDrainageValue"}
                            label={"Stuhlableitung"}
                            options={fecalDrainageOptions}
                            placeholder={"Stuhlableitung wählen"}
                            helpText={helperTextUrinaryFecalForm.fecalDrainageValue}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextArea
                            name={"fecalDrainageNote"}
                            label={"Kommentar"}
                            placeholder={"Ggf. Ergänzungen zur Stuhlableitung..."}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDatePicker name={"lastBowelMovement"} label={"Letzter Stuhlgang"} />
                    </div>
                    <div className={"right"}></div>
                </div>
            </Form>
        </div>
    );
};

export default UrinaryFecalForm;
