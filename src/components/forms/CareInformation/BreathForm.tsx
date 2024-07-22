import { IResponse, MarkdownPIO, StringPIO, SubTree } from "@thaias/pio_editor_meta";
import { Coding, SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React, { useEffect } from "react";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { writeCodingToSubTree } from "../../../services/HelperService";
import { helperTextBreathForm } from "../../../services/HelperTextService";
import PIOService from "../../../services/PIOService";
import { writeStaticFields } from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import InputTextArea from "../../basic/InputTextArea";
import RadioButton from "../../basic/RadioButton";

/**
 * This form contains information about Breath information. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Observation_Respiratory_Access (Composition oder reference in Provenance_Source_of_Information)
 * - KBV_PR_MIO_ULB_Observation_Respiratory_Support (Composition oder reference in Provenance_Source_of_Information)
 * - KBV_PR_MIO_ULB_Observation_Qualitative_Description_Breathing (reference in Care_Problems)
 *
 * PIO-Small exclusions:
 * - KBV_PR_MIO_ULB_Observation_Respiratory_Access
 *      - extension:geraetenutzung
 *      - effectivePeriod
 *      - performer
 *      - dataAbsentReason
 * - KBV_PR_MIO_ULB_Observation_Respiratory_Support
 *      - extension:geraetenutzung
 *      - effectivePeriod
 *      - performer
 * - KBV_PR_MIO_ULB_Observation_Qualitative_Description_Breathing (reference in Care_Problems)
 *      - effectiveDateTime
 *      - performer.reference
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const BreathForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets and Options
    const respiratoryAccessValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Respiratory_Access"
    );
    const respiratoryAccessOptions: SelectOptions = respiratoryAccessValueSet.getOptionsSync;
    const respiratorySupportValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Presence_Respiratory_Support"
    );
    const respiratorySupportOptions: SelectOptions = respiratorySupportValueSet.getOptionsSync.map(
        (option: SelectOption) => {
            if (option.value === "106048009:47429007=40617009,363713009=52101004") option.label = "Vorhanden";
            else option.label = "Nicht vorhanden";
            return option;
        }
    );
    // UUIDs and Paths
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const respiratoryAccessPath: string = "KBV_PR_MIO_ULB_Observation_Respiratory_Access";
    const respiratoryAccessUUID: string = UUIDService.getUUID(respiratoryAccessPath);
    const respiratorySupportPath: string = "KBV_PR_MIO_ULB_Observation_Respiratory_Support";
    const respiratorySupportUUID: string = UUIDService.getUUID(respiratorySupportPath);
    const breathingQualityPath: string = "KBV_PR_MIO_ULB_Observation_Qualitative_Description_Breathing";
    const breathingQualityUUID: string = UUIDService.getUUID(breathingQualityPath);

    // States
    const [respiratoryAccessSubTree, setRespiratoryAccessSubTree] = React.useState<SubTree>();
    const [respiratorySupportSubTree, setRespiratorySupportSubTree] = React.useState<SubTree>();
    const [breathingQualitySubTree, setBreathingQualitySubTree] = React.useState<SubTree>();
    const form = props.form;
    const [required, setRequired] = React.useState<boolean>(false);

    const watchedField = Form.useWatch("respiratorySupportNote", form);
    useEffect((): void => {
        if (watchedField) setRequired(true);
        else {
            setRequired(false);
            form.setFields([
                { name: "respiratorySupportValue", errors: [] },
                { name: "respiratorySupportNote", value: undefined },
            ]);
        }
    }, [watchedField]);

    /** Initialize SubTrees and write existing values to Form fields */
    useEffect(() => {
        PIOService.getSubTrees([
            respiratoryAccessUUID + "." + respiratoryAccessPath,
            respiratorySupportUUID + "." + respiratorySupportPath,
            breathingQualityUUID + "." + breathingQualityPath,
        ]).then((result: IResponse): void => {
            if (result.success) {
                (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                    switch (subTree.lastPathElement) {
                        case respiratoryAccessPath:
                            setRespiratoryAccessSubTree(subTree);
                            const respiratoryAccessValue: string | undefined = subTree
                                .getSubTreeByPath("valueCodeableConcept.coding.code")
                                .getValueAsString();
                            const respiratoryAccessNote: string | undefined = subTree
                                .getSubTreeByPath("note.text")
                                .getValueAsString();
                            form.setFieldsValue({
                                respiratoryAccessValue: respiratoryAccessValue,
                                respiratoryAccessNote: respiratoryAccessNote,
                            });
                            break;
                        case respiratorySupportPath:
                            setRespiratorySupportSubTree(subTree);
                            const respiratorySupportValue: string | undefined = subTree
                                .getSubTreeByPath("valueCodeableConcept.coding.code")
                                .getValueAsString();
                            const respiratorySupportNote: string | undefined = subTree
                                .getSubTreeByPath("note.text")
                                .getValueAsString();
                            form.setFieldsValue({
                                respiratorySupportValue: respiratorySupportValue,
                                respiratorySupportNote: respiratorySupportNote,
                            });
                            break;
                        case breathingQualityPath:
                            setBreathingQualitySubTree(subTree);
                            const breathingQualityNote: string = subTree
                                .getSubTreeByPath("valueString")
                                .getValueAsString() as string;
                            form.setFieldValue("breathingQualityNote", breathingQualityNote);
                            break;
                        default:
                            break;
                    }
                });
            }
        });
    }, []);

    /**
     * Saves the SubTree for a specific property.
     * @param {SubTree} subTree The SubTree to save data into.
     * @param {string} propertyName The name of the property to save data into.
     * @param {IFormFinishObject} value The Form values to save into the SubTree
     * @param {Coding} staticCoding The coding for the 'valueCodeableConcept.coding' property.
     */
    const saveRespiratory = (
        subTree: SubTree,
        propertyName: string,
        value: IFormFinishObject,
        staticCoding: Coding | undefined
    ): void => {
        subTree?.deleteSubTreeByPath("");
        const inputValue = value[propertyName + "Value"];
        const inputNote = value[propertyName + "Note"];
        const valueExists: boolean = inputValue !== undefined;
        const noteExists: boolean = inputNote !== undefined && inputNote !== "";
        if (valueExists)
            writeCodingToSubTree(
                subTree,
                "valueCodeableConcept.coding",
                propertyName === "respiratoryAccess"
                    ? respiratoryAccessValueSet.getObjectByCodeSync(inputValue as string)
                    : respiratorySupportValueSet.getObjectByCodeSync(inputValue as string)
            );
        if (noteExists) subTree?.setValue("note.text", MarkdownPIO.parseFromString(inputNote as string));
        if (valueExists || noteExists) writeStaticFields(subTree, patientUUID, staticCoding as Coding, true);
    };

    /**
     * Saves the SubTree for breathingQuality.
     * @param {IFormFinishObject} value The Form values to save into the SubTree
     */
    const saveBreathingQuality = (value: IFormFinishObject): void => {
        breathingQualitySubTree?.deleteSubTreeByPath("");
        if (value.breathingQualityNote) {
            const staticCoding: Coding = {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "78064003:370132008=26716007",
                display:
                    "Respiratory function (observable entity) : Scale type (attribute) = Qualitative (qualifier value)",
            };
            writeStaticFields(breathingQualitySubTree as SubTree, patientUUID, staticCoding, true);
            breathingQualitySubTree?.setValue(
                "valueString",
                StringPIO.parseFromString(value.breathingQualityNote as string)
            );
        }
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        saveBreathingQuality(value);
        saveRespiratory(respiratoryAccessSubTree as SubTree, "respiratoryAccess", value, {
            system: "http://snomed.info/sct",
            version: "http://snomed.info/sct/900000000000207008/version/20220331",
            code: "313292002",
            display: "Route of breathing (observable entity)",
        });
        saveRespiratory(respiratorySupportSubTree as SubTree, "respiratorySupport", value, {
            system: "http://snomed.info/sct",
            version: "http://snomed.info/sct/900000000000207008/version/20220331",
            code: "363787002:704321009=40617009",
            display:
                "Observable entity (observable entity) : Characterizes (attribute) = Artificial respiration (procedure)",
        });

        PIOService.saveSubTrees([
            respiratoryAccessSubTree as SubTree,
            respiratorySupportSubTree as SubTree,
            breathingQualitySubTree as SubTree,
        ]).then((result: IResponse): void => {
            if (!result.success) console.error("BreathForm saving error", result.message);
        });
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"BreathForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <RadioButton
                            name={"respiratoryAccessValue"}
                            label={"Atemwegszugang"}
                            options={respiratoryAccessOptions}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextArea
                            name={"respiratoryAccessNote"}
                            label={"Kommentar"}
                            placeholder={"Ggf. Ergänzungen zum Atemwegszugang..."}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <RadioButton
                            name={"respiratorySupportValue"}
                            label={"Atemunterstützung"}
                            options={respiratorySupportOptions}
                            rules={[{ required: required, message: "Bitte geben Sie eine Atemunterstützung an!" }]}
                            helpText={helperTextBreathForm.respiratorySupportValue}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextArea
                            name={"respiratorySupportNote"}
                            label={"Kommentar"}
                            placeholder={"Ggf. Ergänzungen zum Atemunerstützung..."}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputTextArea
                            name={"breathingQualityNote"}
                            label={"Qualitative Beschreibung der Atmung"}
                            placeholder={"Angaben zur Atmung"}
                        />
                    </div>
                </div>
            </Form>
        </div>
    );
};

export default BreathForm;
