import {
    CodePIO,
    DecimalPIO,
    IResponse,
    MarkdownPIO,
    StringPIO,
    SubTree,
    UriPIO,
    UuidPIO,
} from "@thaias/pio_editor_meta";
import { Coding, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React, { useEffect } from "react";

import { IBloodPressureValue, IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { rangeOptions, writeCodingToSubTree } from "../../../services/HelperService";
import { helperTextVitalBodyForm } from "../../../services/HelperTextService";
import PIOService from "../../../services/PIOService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import InputDropDown from "../../basic/InputDropDown";
import InputNumericField from "../../basic/InputNumericField";
import InputTextArea from "../../basic/InputTextArea";
import Label from "../../basic/Label";
import RadioButton from "../../basic/RadioButton";

/**
 * This form contains information about vital signs. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_DiagnosticReport_Vital_Signs_and_Body_Measures (handled in backend)
 * - KBV_PR_MIO_ULB_Observation_Body_Weight
 * - KBV_PR_MIO_ULB_Observation_Body_Height
 * - KBV_PR_MIO_ULB_Observation_Body_Temperature
 * - KBV_PR_MIO_ULB_Observation_Blood_Pressure
 * - KBV_PR_MIO_ULB_Observation_Peripheral_Oxygen_Saturation
 * - KBV_PR_MIO_ULB_Observation_Respiratory_Rate
 * - KBV_PR_MIO_ULB_Observation_Heart_Rate
 * - KBV_PR_MIO_ULB_Observation_Glucose_Concentration
 *
 * PIO-Small exclusions:
 *      - valueQuantity.comparator
 *      - effectiveDateTime
 *      - bodySite
 *      - method
 * PIO-Small changes:
 *      - code: if no fixed pattern given, most plausible code is chosen
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const VitalBodyForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets and Options
    const bodyWeightUnitValueSet: ValueSets = new ValueSets("http://fhir.de/ValueSet/VitalSignDE_Body_Weigth_UCUM");
    const bodyWeightOptions: SelectOptions = bodyWeightUnitValueSet.getOptionsSync;
    const glucoseConcentrationSnomedValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_Base_Glucose_Concentration_SNOMED_CT"
    );
    const glucoseConcentrationSnomedOptions: SelectOptions = glucoseConcentrationSnomedValueSet.getOptionsSync;
    const glucoseConcentrationLoincValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_Base_Glucose_Concentration_LOINC"
    );
    const glucoseConcentrationUnitValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_Base_Glucose_Concentration_Unit"
    );
    const glucoseConcentrationUnitOptions: SelectOptions = glucoseConcentrationUnitValueSet.getOptionsSync;

    // UUIDs and paths
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const bodyWeightPath: string = "KBV_PR_MIO_ULB_Observation_Body_Weight";
    const bodyWeightUUID: string = UUIDService.getUUID(bodyWeightPath);
    const bodyHeightPath: string = "KBV_PR_MIO_ULB_Observation_Body_Height";
    const bodyHeightUUID: string = UUIDService.getUUID(bodyHeightPath);
    const bodyTemperaturePath: string = "KBV_PR_MIO_ULB_Observation_Body_Temperature";
    const bodyTemperatureUUID: string = UUIDService.getUUID(bodyTemperaturePath);
    const bloodPressurePath: string = "KBV_PR_MIO_ULB_Observation_Blood_Pressure";
    const bloodPressureUUID: string = UUIDService.getUUID(bloodPressurePath);
    const oxygenSaturationPath: string = "KBV_PR_MIO_ULB_Observation_Peripheral_Oxygen_Saturation";
    const oxygenSaturationUUID: string = UUIDService.getUUID(oxygenSaturationPath);
    const breathingRatePath: string = "KBV_PR_MIO_ULB_Observation_Respiratory_Rate";
    const breathingRateUUID: string = UUIDService.getUUID(breathingRatePath);
    const heartRatePath: string = "KBV_PR_MIO_ULB_Observation_Heart_Rate";
    const heartRateUUID: string = UUIDService.getUUID(heartRatePath);
    const glucoseConcentrationPath: string = "KBV_PR_MIO_ULB_Observation_Glucose_Concentration";
    const glucoseConcentrationUUID: string = UUIDService.getUUID(glucoseConcentrationPath);

    // States
    const [bodyWeightSubTree, setBodyWeightSubTree] = React.useState<SubTree>();
    const [bodyHeightSubTree, setBodyHeightSubTree] = React.useState<SubTree>();
    const [bodyTemperatureSubTree, setBodyTemperatureSubTree] = React.useState<SubTree>();
    const [bloodPressureSubTree, setBloodPressureSubTree] = React.useState<SubTree>();
    const [oxygenSaturationSubTree, setOxygenSaturationSubTree] = React.useState<SubTree>();
    const [breathingRateSubTree, setBreathingRateSubTree] = React.useState<SubTree>();
    const [heartRateSubTree, setHeartRateSubTree] = React.useState<SubTree>();
    const [glucoseConcentrationSubTree, setGlucoseConcentrationSubTree] = React.useState<SubTree>();
    const form = props.form;
    const [bodyMassRequired, setBodyMassRequired] = React.useState<boolean>(false);
    const [heightRequired, setHeightRequired] = React.useState<boolean>(false);
    const [bodyTemperatureRequired, setBodyTemperatureRequired] = React.useState<boolean>(false);
    const [bloodPressureRequired, setBloodPressureRequired] = React.useState<boolean>(false);
    const [oxygenSaturationRequired, setOxygenSaturationRequired] = React.useState<boolean>(false);
    const [breathingRateRequired, setBreathingRateRequired] = React.useState<boolean>(false);
    const [heartRateRequired, setHeartRateRequired] = React.useState<boolean>(false);
    const [glucoseLevelRequired, setGlucoseLevelRequired] = React.useState<boolean>(false);

    // Static or default units and codes
    const staticsForField = {
        bodyMass: {
            unit: { unit: "kg", code: "kg" },
            loinc: {
                valueSet: new ValueSets("http://fhir.de/ValueSet/VitalSignDE_Body_Weight_Loinc"),
                code: "29463-7",
            },
            snomed: {
                valueSet: new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Body_Weight_SNOMED_CT"),
                code: "27113001",
            },
        },
        height: {
            unit: { unit: "cm", code: "cm" },
            loinc: {
                valueSet: new ValueSets("http://fhir.de/ValueSet/VitalSignDE_Body_Height_Loinc"),
                code: "8302-2",
            },
            snomed: {
                valueSet: new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Body_Height_SNOMED_CT"),
                code: "1153637007",
            },
        },
        bodyTemperature: {
            unit: { unit: "Cel", code: "Cel" },
            loinc: {
                coding: {
                    system: "http://loinc.org",
                    version: "2.72",
                    code: "8310-5",
                    display: "Body temperature",
                },
            },
            snomed: {
                valueSet: new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Body_Temperature_SNOMED_CT"),
                code: "386725007",
            },
        },
        bloodPressure: {
            unit: { unit: "mm Hg", code: "mm[Hg]" },
            loinc: {
                coding: {
                    system: "http://loinc.org",
                    version: "2.72",
                    code: "85354-9",
                    display: "Blood pressure panel with all children optional",
                },
            },
            snomed: {
                coding: {
                    system: "http://snomed.info/sct",
                    version: "http://snomed.info/sct/900000000000207008/version/20220331",
                    code: "75367002",
                    display: "Blood pressure (observable entity)",
                },
            },
        },
        breathingRate: {
            unit: { unit: "per minute", code: "/min" },
            loinc: {
                coding: {
                    system: "http://loinc.org",
                    version: "2.72",
                    code: "9279-1",
                    display: "Respiratory rate",
                },
            },
            snomed: {
                valueSet: new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Respiratory_Rate_SNOMED_CT"),
                code: "86290005",
            },
        },
        heartRate: {
            unit: { unit: "per minute", code: "/min" },
            loinc: {
                coding: {
                    system: "http://loinc.org",
                    version: "2.72",
                    code: "8867-4",
                    display: "Heart rate",
                },
            },
            snomed: {
                valueSet: new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Heart_Rate_SNOMED_CT"),
                code: "364075005",
            },
        },
        oxygenSaturation: {
            unit: { unit: "%", code: "%" },
            loinc: {
                coding: {
                    system: "http://loinc.org",
                    version: "2.72",
                    code: "2708-6",
                    display: "Oxygen saturation in Arterial blood",
                },
            },
            snomed: {
                coding: {
                    system: "http://snomed.info/sct",
                    version: "http://snomed.info/sct/900000000000207008/version/20220331",
                    code: "431314004",
                    display: "Peripheral oxygen saturation (observable entity)",
                },
            },
        },
        glucoseLevel: {
            unit: { unit: "mmol/L", code: "mmol/L" },
            loinc: {
                valueSet: new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Glucose_Concentration_LOINC"),
                code: "2339-0",
            },
            snomed: {
                valueSet: new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Glucose_Concentration_SNOMED_CT"),
                code: "434912009",
            },
        },
    };

    /**
     * Function for writing values to input fields with optional note.
     * @param {SubTree} subTree SubTree to get the values for the form
     * @param {string} fieldName The name of the field to set in the form
     * @param {boolean} hasNote Whether the field has a note or not
     */
    const setFields = (subTree: SubTree, fieldName: string, hasNote: boolean = false): void => {
        const value: string | undefined = subTree.getSubTreeByPath("valueQuantity.value")?.getValueAsString();
        const fieldValues: Record<string, string | undefined> = {
            [`${fieldName}Value`]: value,
        };
        if (hasNote) fieldValues[`${fieldName}Comment`] = subTree.getSubTreeByPath("note.text")?.getValueAsString();
        fieldValues[`${fieldName}Unit`] =
            subTree.getSubTreeByPath("valueQuantity.unit")?.getValueAsString() ??
            staticsForField[fieldName.toString()].unit.unit;
        form.setFieldsValue(fieldValues);
    };

    const setBloodPressureFields = (subTree: SubTree): void => {
        const systolic: string | undefined = subTree
            .getSubTreeByPath("component[0].valueQuantity.value")
            ?.getValueAsString();
        const diastolic: string | undefined = subTree
            .getSubTreeByPath("component[1].valueQuantity.value")
            ?.getValueAsString();
        form.setFieldsValue({
            bloodPressureValue: { systolic: systolic, diastolic: diastolic },
            bloodPressureComment: subTree.getSubTreeByPath("note.text")?.getValueAsString(),
        });
    };

    /**
     * Returns the snomed code stored under path code.coding[x].code for the glucose resource. The glucose resource must
     * hold a loinc code AND a snomed code. This is why we need to find the right code.
     * @param {SubTree} subTree A glucose SubTree
     * @returns {string | undefined} The snomed code as string if the code was found, otherwise undefined
     */
    const getGlucoseSnomedCodeFromSubTree = (subTree: SubTree): string | undefined => {
        const codingSubTrees: SubTree[] = subTree.getSubTreeByPath("code.coding").children;
        const snomedSubTree: SubTree | undefined = codingSubTrees.find(
            (item: SubTree) => item.getSubTreeByPath("system").getValueAsString() === "http://snomed.info/sct"
        );
        return snomedSubTree?.getSubTreeByPath("code").getValueAsString();
    };

    /** Initialize SubTrees and write existing values to Form fields */
    useEffect((): void => {
        PIOService.getSubTrees([
            bodyWeightUUID + "." + bodyWeightPath,
            bodyHeightUUID + "." + bodyHeightPath,
            bodyTemperatureUUID + "." + bodyTemperaturePath,
            bloodPressureUUID + "." + bloodPressurePath,
            oxygenSaturationUUID + "." + oxygenSaturationPath,
            breathingRateUUID + "." + breathingRatePath,
            heartRateUUID + "." + heartRatePath,
            glucoseConcentrationUUID + "." + glucoseConcentrationPath,
        ]).then((result: IResponse): void => {
            if (!result.success) return;
            (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                switch (subTree.lastPathElement) {
                    case bodyWeightPath:
                        setBodyWeightSubTree(subTree);
                        setFields(subTree, "bodyMass", true);
                        break;
                    case bodyHeightPath:
                        setBodyHeightSubTree(subTree);
                        setFields(subTree, "height", true);
                        break;
                    case bodyTemperaturePath:
                        setBodyTemperatureSubTree(subTree);
                        setFields(subTree, "bodyTemperature", true);
                        break;
                    case bloodPressurePath:
                        setBloodPressureSubTree(subTree);
                        setBloodPressureFields(subTree);
                        break;
                    case oxygenSaturationPath:
                        setOxygenSaturationSubTree(subTree);
                        setFields(subTree, "oxygenSaturation", true);
                        break;
                    case breathingRatePath:
                        setBreathingRateSubTree(subTree);
                        setFields(subTree, "breathingRate", true);
                        break;
                    case heartRatePath:
                        setHeartRateSubTree(subTree);
                        setFields(subTree, "heartRate", true);
                        break;
                    case glucoseConcentrationPath:
                        setGlucoseConcentrationSubTree(subTree);
                        const glucoseMethodSnomedCode: string | undefined = getGlucoseSnomedCodeFromSubTree(subTree);
                        if (glucoseMethodSnomedCode)
                            form.setFieldsValue({ glucoseLevelMethod: glucoseMethodSnomedCode });
                        else form.setFieldsValue({ glucoseLevelMethod: "434912009" });
                        setFields(subTree, "glucoseLevel", true);
                        break;
                    default:
                        break;
                }
            });
        });
    }, []);

    /**
     * Watch if the comment field is filled. If so, set the required flag to true.
     * If the comment field is empty, set the required flag to false and remove the error message.
     */
    const watchBodyMassComment = Form.useWatch("bodyMassComment", form);
    useEffect((): void => {
        if (watchBodyMassComment != null && watchBodyMassComment !== "") setBodyMassRequired(true);
        else {
            setBodyMassRequired(false);
            form.setFields([{ name: "bodyMassValue", errors: [] }]);
        }
    }, [watchBodyMassComment]);

    const watchHeightComment = Form.useWatch("heightComment", form);
    useEffect((): void => {
        if (watchHeightComment != null && watchHeightComment !== "") setHeightRequired(true);
        else {
            setHeightRequired(false);
            form.setFields([{ name: "heightValue", errors: [] }]);
        }
    }, [watchHeightComment]);

    const watchBodyTemperatureComment = Form.useWatch("bodyTemperatureComment", form);
    useEffect((): void => {
        if (watchBodyTemperatureComment != null && watchBodyTemperatureComment !== "") setBodyTemperatureRequired(true);
        else {
            setBodyTemperatureRequired(false);
            form.setFields([{ name: "bodyTemperatureValue", errors: [] }]);
        }
    }, [watchBodyTemperatureComment]);

    const watchBloodPressureComment = Form.useWatch("bloodPressureComment", form);
    useEffect((): void => {
        if (watchBloodPressureComment != null && watchBloodPressureComment !== "") setBloodPressureRequired(true);
        else {
            setBloodPressureRequired(false);
            form.setFields([{ name: "bloodPressureValue", errors: [] }]);
        }
    }, [watchBloodPressureComment]);

    const watchOxygenSaturationComment = Form.useWatch("oxygenSaturationComment", form);
    useEffect((): void => {
        if (watchOxygenSaturationComment != null && watchOxygenSaturationComment !== "")
            setOxygenSaturationRequired(true);
        else {
            setOxygenSaturationRequired(false);
            form.setFields([{ name: "oxygenSaturationValue", errors: [] }]);
        }
    }, [watchOxygenSaturationComment]);

    const watchBreathingRateComment = Form.useWatch("breathingRateComment", form);
    useEffect((): void => {
        if (watchBreathingRateComment != null && watchBreathingRateComment !== "") setBreathingRateRequired(true);
        else {
            setBreathingRateRequired(false);
            form.setFields([{ name: "breathingRateValue", errors: [] }]);
        }
    }, [watchBreathingRateComment]);

    const watchHeartRateComment = Form.useWatch("heartRateComment", form);
    useEffect((): void => {
        if (watchHeartRateComment != null && watchHeartRateComment !== "") setHeartRateRequired(true);
        else {
            setHeartRateRequired(false);
            form.setFields([{ name: "heartRateValue", errors: [] }]);
        }
    }, [watchHeartRateComment]);

    const watchGlucoseLevelComment = Form.useWatch("glucoseLevelComment", form);
    useEffect((): void => {
        if (watchGlucoseLevelComment != null && watchGlucoseLevelComment !== "") setGlucoseLevelRequired(true);
        else {
            setGlucoseLevelRequired(false);
            form.setFields([{ name: "glucoseLevelValue", errors: [] }]);
        }
    }, [watchGlucoseLevelComment]);

    const saveValueQuantity = (
        subTree: SubTree,
        path: string,
        value: string | undefined,
        unit: string,
        code: string
    ): void => {
        subTree.setValue(path + ".value", DecimalPIO.parseFromString(value));
        subTree.setValue(path + ".unit", StringPIO.parseFromString(unit));
        subTree.setValue(path + ".system", UriPIO.parseFromString("http://unitsofmeasure.org"));
        subTree.setValue(path + ".code", CodePIO.parseFromString(code));
    };

    const saveBloodPressureValues = (subTree: SubTree, value: IFormFinishObject): void => {
        const systolicValue: string | undefined = (value.bloodPressureValue as IBloodPressureValue)
            .systolic as unknown as string | undefined;
        const diastolicValue: string | undefined = (value.bloodPressureValue as IBloodPressureValue)
            .diastolic as unknown as string | undefined;
        if (!systolicValue || !diastolicValue) return;
        // Static codings for both blood pressure fields
        const systolicCodings: Coding[] = [
            {
                system: "http://loinc.org",
                version: "2.72",
                code: "8480-6",
                display: "Systolic blood pressure",
            },
            {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "271649006",
                display: "Systolic blood pressure (observable entity)",
            },
        ];
        const diastolicCodings: Coding[] = [
            {
                system: "http://loinc.org",
                version: "2.72",
                code: "8462-4",
                display: "Diastolic blood pressure",
            },
            {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "271650006",
                display: "Diastolic blood pressure (observable entity)",
            },
        ];
        // Systolic values
        saveValueQuantity(subTree, "component[0].valueQuantity", systolicValue, "mm Hg", "mm[Hg]");
        writeCodingToSubTree(subTree, "component[0].code.coding[0]", systolicCodings[0]);
        writeCodingToSubTree(subTree, "component[0].code.coding[1]", systolicCodings[1]);
        // Diastolic values
        saveValueQuantity(subTree, "component[1].valueQuantity", diastolicValue, "mm Hg", "mm[Hg]");
        writeCodingToSubTree(subTree, "component[1].code.coding[0]", diastolicCodings[0]);
        writeCodingToSubTree(subTree, "component[1].code.coding[1]", diastolicCodings[1]);
    };

    /**
     * Helper function to write code codings to SubTree based on fieldType and lookUpTable
     * @param {SubTree} subTree The SubTree to write the coding to
     * @param {string} fieldName The name of the field to find valueset or coding for the resource
     */
    const writeCodeForField = (subTree: SubTree, fieldName: string): void => {
        const loinc = staticsForField[fieldName.toString()].loinc;
        const snomed = staticsForField[fieldName.toString()].snomed;
        let counter: number = 0;
        if (loinc) {
            writeCodingToSubTree(
                subTree,
                "code.coding[0]",
                loinc.coding ?? (loinc.valueSet as ValueSets).getObjectByCodeSync(loinc.code)
            );
            counter++;
        }
        if (snomed)
            writeCodingToSubTree(
                subTree,
                `code.coding[${counter}]`,
                snomed.coding ?? (snomed.valueSet as ValueSets).getObjectByCodeSync(snomed.code)
            );
    };

    /**
     * Writes special codes to glucose resource.
     * @param {IFormFinishObject} value Value from all form input fields
     * @param {SubTree} subTree Glucose SubTree to write the codes to
     */
    const writeGlucoseCodes = (value: IFormFinishObject, subTree: SubTree): void => {
        const methodSnomedCode: string = value.glucoseLevelMethod as string;
        const unit: string = value.glucoseLevelUnit as string;

        //Write snomed code
        writeCodingToSubTree(
            subTree,
            "code.coding[0]",
            glucoseConcentrationSnomedValueSet.getObjectByCodeSync(value.glucoseLevelMethod as string)
        );

        //Write loinc code
        let loincCode: string | undefined = undefined;
        if (methodSnomedCode === "434912009" && unit === "mmol/L") loincCode = "15074-8";
        else if (methodSnomedCode === "434912009" && unit === "mg/dL") loincCode = "2339-0";
        else if (methodSnomedCode === "434910001" && unit === "mmol/L") loincCode = "14745-4";
        else if (methodSnomedCode === "434910001" && unit === "mg/dL") loincCode = "2344-0";
        if (loincCode)
            writeCodingToSubTree(
                subTree,
                "code.coding[1]",
                glucoseConcentrationLoincValueSet.getObjectByCodeSync(loincCode)
            );
    };

    /**
     * Saves a SubTree.
     * @param {SubTree} subTree The SubTree to save data into.
     * @param {IFormFinishObject} value The Form values to save into the SubTree
     * @param {string} propertyName The name of the property to save data into.
     * @param {boolean} hasNote Whether the field has a note or not.
     */
    // eslint-disable-next-line sonarjs/cognitive-complexity
    const saveSubTree = (
        subTree: SubTree,
        value: IFormFinishObject,
        propertyName: string,
        hasNote: boolean = false
    ): void => {
        let valueExists: boolean = value[propertyName + "Value"] !== undefined && value[propertyName + "Value"] !== "";
        if (
            propertyName === "bloodPressure" &&
            (value.bloodPressureValue as IBloodPressureValue).systolic === undefined &&
            (value.bloodPressureValue as IBloodPressureValue).diastolic === undefined
        )
            valueExists = false;
        const noteExists: boolean =
            hasNote && value[propertyName + "Comment"] !== undefined && value[propertyName + "Comment"] !== "";
        if (valueExists) {
            const unit: string =
                (value[propertyName + "Unit"] as string | undefined) ??
                staticsForField[propertyName.toString()].unit.unit;
            const code: string =
                (value[propertyName + "Unit"] as string | undefined) ??
                staticsForField[propertyName.toString()].unit.code;
            if (propertyName === "bloodPressure") saveBloodPressureValues(subTree, value);
            else saveValueQuantity(subTree, "valueQuantity", value[propertyName + "Value"] as string, unit, code);
        }
        if (noteExists)
            subTree?.setValue("note.text", MarkdownPIO.parseFromString(value[propertyName + "Comment"] as string));
        if (!valueExists && !noteExists) return;
        // General values
        subTree.setValue("subject.reference", UuidPIO.parseFromString(patientUUID));
        subTree.setValue("status", CodePIO.parseFromString("final"));
        const categoryCodings: Coding[] = [
            {
                system: "http://terminology.hl7.org/CodeSystem/observation-category",
                code: "vital-signs",
            },
            {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "1184593002",
                display: "Vital sign document section (record artifact)",
            },
        ];
        writeCodingToSubTree(subTree, "category[0].coding", categoryCodings[0]);
        writeCodingToSubTree(subTree, "category[1].coding", categoryCodings[1]);
        // Write codes
        if (propertyName !== "glucoseLevel") writeCodeForField(subTree, propertyName);
        else writeGlucoseCodes(value, subTree);
        //Write measurement method to oxygen saturation subTree
        if (propertyName === "oxygenSaturation")
            writeCodingToSubTree(subTree, "method.coding", {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "448703006",
                display: "Pulse oximeter (physical object)",
            });
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        const fieldsToTrees = {
            bodyMass: bodyWeightSubTree,
            height: bodyHeightSubTree,
            bodyTemperature: bodyTemperatureSubTree,
            bloodPressure: bloodPressureSubTree,
            oxygenSaturation: oxygenSaturationSubTree,
            breathingRate: breathingRateSubTree,
            heartRate: heartRateSubTree,
            glucoseLevel: glucoseConcentrationSubTree,
        };
        const subTrees: SubTree[] = [];
        Object.entries(fieldsToTrees).forEach(([field, subTree]): void => {
            subTree?.deleteSubTreeByPath("");
            if (value[field + "Value"] || value[field + "Comment"]) saveSubTree(subTree as SubTree, value, field, true);
            subTrees.push(subTree as SubTree);
        });

        PIOService.saveSubTrees(subTrees).then((result: IResponse): void => {
            if (!result) console.debug(result);
        });
    };

    return (
        <div onBlur={form.submit} className={"vitalBodyForm"}>
            <Form layout={"vertical"} name={"VitalBodyForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputNumericField
                            name={"bodyMassValue"}
                            label={"Gewicht"}
                            wide={false}
                            placeholder={"Gewicht"}
                            rules={[
                                {
                                    required: bodyMassRequired,
                                    message: "Bitte Gewicht angeben!",
                                },
                            ]}
                        />
                        <InputDropDown
                            name={"bodyMassUnit"}
                            label={"Einheit"}
                            placeholder={"Einheit wählen"}
                            wide={false}
                            options={bodyWeightOptions}
                            defaultValue={"kg"}
                            allowClear={false}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextArea
                            name={"bodyMassComment"}
                            label={"Kommentar"}
                            wide={true}
                            placeholder={"Ggf. Ergänzungen zum Gewicht..."}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputNumericField
                            name={"heightValue"}
                            label={"Größe"}
                            wide={false}
                            placeholder={"Größe angeben"}
                            rules={[
                                {
                                    required: heightRequired,
                                    message: "Bitte Größe angeben!",
                                },
                            ]}
                        />
                        <InputDropDown
                            name={"heightUnit"}
                            label={"Einheit"}
                            placeholder={"Einheit wählen"}
                            wide={false}
                            defaultValue={"cm"}
                            options={[{ value: "cm", label: "cm" }]}
                            disabled={true}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextArea
                            name={"heightComment"}
                            label={"Kommentar"}
                            placeholder={"Ggf. Ergänzungen zur Größe..."}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputNumericField
                            name={"bodyTemperatureValue"}
                            label={"Temperatur"}
                            wide={false}
                            placeholder={"Temperataur in °C"}
                            rules={[
                                {
                                    required: bodyTemperatureRequired,
                                    message: "Bitte Temperatur angeben!",
                                },
                            ]}
                        />
                        <InputDropDown
                            name={"bodyTemperatureUnit"}
                            label={"Einheit"}
                            placeholder={"Einheit wählen"}
                            wide={false}
                            disabled={true}
                            defaultValue={"Cel"}
                            options={[{ value: "Cel", label: "°C" }]}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextArea
                            name={"bodyTemperatureComment"}
                            label={"Kommentar"}
                            placeholder={"Ggf. Ergänzungen zur Temperatur..."}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <Label smallBottomMargin={true} title={"Blutdruck (mm/Hg)"} required={false} />
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputNumericField
                            name={["bloodPressureValue", "systolic"]}
                            label={"Systolisch"}
                            wide={false}
                            placeholder={"systolisch"}
                            rules={[
                                {
                                    required: bloodPressureRequired,
                                    message: "Bitte Blutdruck angeben!",
                                },
                            ]}
                        />
                        <InputNumericField
                            name={["bloodPressureValue", "diastolic"]}
                            label={"Diastolisch"}
                            wide={false}
                            placeholder={"diastolisch"}
                            rules={[
                                {
                                    required: bloodPressureRequired,
                                    message: "",
                                },
                            ]}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextArea
                            name={"bloodPressureComment"}
                            label={"Kommentar"}
                            placeholder={"Ggf. Ergänzungen zum Blutdruck..."}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            name={"oxygenSaturationValue"}
                            label={"Sauerstoffsättigung"}
                            options={rangeOptions(70, 100, 1, "%")}
                            wide={false}
                            placeholder={"Sauerstoffsättigung in %"}
                            rules={[
                                {
                                    required: oxygenSaturationRequired,
                                    message: "Bitte Sauerstoffsättigung angeben!",
                                },
                            ]}
                            helpText={helperTextVitalBodyForm.oxygenSaturationValue}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextArea
                            name={"oxygenSaturationComment"}
                            label={"Kommentar"}
                            placeholder={"Ggf. Ergänzungen zur Sauerstoffsättigung..."}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputNumericField
                            name={"breathingRateValue"}
                            label={"Atemfrequenz (pro Minute)"}
                            wide={false}
                            placeholder={"Atemfrequenz eingeben"}
                            rules={[
                                {
                                    required: breathingRateRequired,
                                    message: "Bitte Atemfrequenz angeben!",
                                },
                            ]}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextArea
                            name={"breathingRateComment"}
                            label={"Kommentar"}
                            placeholder={"Ggf. Ergänzungen zur Atemfrequenz..."}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputNumericField
                            name={"heartRateValue"}
                            label={"Herzfrequenz (pro Minute)"}
                            wide={false}
                            placeholder={"Herzfrequenz"}
                            rules={[
                                {
                                    required: heartRateRequired,
                                    message: "Bitte Herzfrequenz angeben!",
                                },
                            ]}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextArea
                            name={"heartRateComment"}
                            label={"Kommentar"}
                            placeholder={"Ggf. Ergänzungen zur Herzfrequenz..."}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <RadioButton
                            name={"glucoseLevelMethod"}
                            label={"Glukosespiegel Messmethode"}
                            options={glucoseConcentrationSnomedOptions}
                            unknownOption={false}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputNumericField
                            name={"glucoseLevelValue"}
                            label={"Glukosespiegel"}
                            wide={false}
                            placeholder={"Glukosespiegel"}
                            rules={[
                                {
                                    required: glucoseLevelRequired,
                                    message: "Bitte Glukosespiegel angeben!",
                                },
                            ]}
                        />
                        <InputDropDown
                            name={"glucoseLevelUnit"}
                            label={"Einheit"}
                            placeholder={"Einheit wählen"}
                            defaultValue={"mmol/L"}
                            options={glucoseConcentrationUnitOptions}
                            wide={false}
                            allowClear={false}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextArea
                            name={"glucoseLevelComment"}
                            label={"Kommentar"}
                            placeholder={"Ggf. Ergänzungen zum Glukosespiegel..."}
                        />
                    </div>
                </div>
            </Form>
        </div>
    );
};

export default VitalBodyForm;
