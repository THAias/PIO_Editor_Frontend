import {
    DateTimePIO,
    IFullNameObject,
    IMedicalProblemObject,
    IPractitionerObject,
    IResponse,
    ITimePeriodObject,
    MarkdownPIO,
    SubTree,
    UuidPIO,
} from "@thaias/pio_editor_meta";
import { Coding, SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { validate } from "uuid";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { RootState } from "../../../@types/ReduxTypes";
import {
    checkCoding,
    convertDateJsToString,
    convertStringToDayJs,
    getNameLabel,
    writeCodingToSubTree,
} from "../../../services/HelperService";
import PIOService from "../../../services/PIOService";
import { onFinishMulti, setValueIfExists, updateFindingState } from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import MedicalProblemWrapper from "../../wrappers/MedicalProblemWrapper";
import MultiWrapper from "../../wrappers/MultiWrapper";

/**
 * This form contains information about the medical problems. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Condition_Medical_Problem_Diagnosis
 * - KBV_PR_MIO_ULB_Observation_Presence_Problems (handled in Backend)
 *
 * PIO-Small exclusions:
 * - extension:Feststellungsdatum
 * - recordedDate
 * - onsetAge
 * - abatementAge
 * - bodySite should be a codeSystem, which is missing on simplifier. Text field is used instead. Path "bodySite.text" is used.
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const MedicalProblemForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets and Options
    const medicalProblemCodeValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_Base_Diagnosis_SNOMED_CT"
    );
    const medicalProblemCodeOptions: SelectOptions = medicalProblemCodeValueSet.getOptionsSync;
    const medicalProblemSeverityValueSet: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/condition-severity");
    const medicalProblemVerificationStatusValueSet: ValueSets = new ValueSets(
        "http://hl7.org/fhir/ValueSet/condition-ver-status"
    );
    const medicalProblemClinicalStatusValueSet: ValueSets = new ValueSets(
        "http://hl7.org/fhir/ValueSet/condition-clinical"
    );

    // UUIDs and Paths
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const medicalProblemFindingPath: string = "KBV_PR_MIO_ULB_Condition_Medical_Problem_Diagnosis";
    const medicalProblemFindingUUIDs: string[] | undefined = UUIDService.getUUIDs(medicalProblemFindingPath);

    // States
    const [medicalProblemFindingSubTrees, setMedicalProblemFindingSubTrees] = React.useState<Record<string, SubTree>>(
        {}
    );
    const form = props.form;
    const practitionerReduxState: IPractitionerObject[] = useSelector((state: RootState) => state.practitionerState);

    /** Initialize SubTrees and write existing values to Form fields */
    useEffect((): void => {
        if (!medicalProblemFindingUUIDs || medicalProblemFindingUUIDs.length === 0) return;

        const subTreePaths: string[] = medicalProblemFindingUUIDs.map(
            (uuid: string): string => `${uuid}.${medicalProblemFindingPath}`
        );
        PIOService.getSubTrees(subTreePaths)
            .then((result: IResponse): void => {
                if (!result.success || !result.data) return;

                const subTrees: SubTree[] = result.data.subTrees as SubTree[];
                const fieldValues: IMedicalProblemObject[] = subTrees.map((subTree: SubTree): IMedicalProblemObject => {
                    const medicalProblemId: string = subTree.absolutePath.split(".")[0];
                    const getCode: string | undefined = checkCoding(subTree, "code.coding", medicalProblemCodeOptions);
                    const getAsserterRef: string | undefined = subTree
                        .getSubTreeByPath("asserter.reference")
                        ?.data?.get() as string | undefined;
                    const getNoteText: string | undefined = subTree.getSubTreeByPath("note.text")?.getValueAsString?.();
                    const getOnsetDateTime: string | undefined = subTree
                        .getSubTreeByPath("onsetDateTime")
                        ?.getValueAsString();
                    const getAbatementDateTime: string | undefined = subTree
                        .getSubTreeByPath("abatementDateTime")
                        ?.getValueAsString();
                    const getClinicalStatus: string | undefined = checkCoding(
                        subTree,
                        "clinicalStatus.coding",
                        medicalProblemClinicalStatusValueSet.getOptionsSync
                    );
                    const getSeverity: string | undefined = subTree
                        .getSubTreeByPath("severity.coding.code")
                        ?.getValueAsString();
                    const getVerificationStatus: string | undefined = checkCoding(
                        subTree,
                        "verificationStatus.coding",
                        medicalProblemVerificationStatusValueSet.getOptionsSync
                    );

                    return {
                        id: medicalProblemId,
                        medicalProblemCode: getCode || "",
                        medicalProblemPerformer: getAsserterRef,
                        medicalProblemComment: getNoteText,
                        medicalProblemPeriod: {
                            start: getOnsetDateTime ? convertStringToDayJs(getOnsetDateTime) : undefined,
                            end: getAbatementDateTime ? convertStringToDayJs(getAbatementDateTime) : undefined,
                        },
                        medicalProblemClinicalStatus: getClinicalStatus,
                        medicalProblemSeverity: getSeverity,
                        medicalProblemVerificationStatus: getVerificationStatus,
                    };
                });

                form.setFieldValue(["MedicalProblemForm"], fieldValues);
                updateFindingState(subTrees, setMedicalProblemFindingSubTrees);
            })
            .catch((error): void => {
                console.error("Error fetching subTrees:", error);
            });
    }, []);

    /**
     * Saves the data from the input fields and general values to the SubTree.
     * @param {SubTree} subTree SubTree to save the data to
     * @param {IMedicalProblemObject} finding Object which holds the input data
     * @returns {SubTree} The modified SubTree
     */
    // eslint-disable-next-line sonarjs/cognitive-complexity
    const updateSubTree = (subTree: SubTree, finding: IMedicalProblemObject): SubTree => {
        const {
            medicalProblemClinicalStatus,
            medicalProblemCode,
            medicalProblemComment,
            medicalProblemPerformer,
            medicalProblemPeriod,
            medicalProblemSeverity,
            medicalProblemVerificationStatus,
        }: IMedicalProblemObject = finding;

        subTree.deleteSubTreeByPath("");

        if (medicalProblemPerformer && validate(medicalProblemPerformer))
            setValueIfExists("asserter.reference", UuidPIO.parseFromString(medicalProblemPerformer), subTree);
        setValueIfExists("note.text", MarkdownPIO.parseFromString(medicalProblemComment), subTree);
        if (medicalProblemPeriod) {
            const { start, end }: ITimePeriodObject = medicalProblemPeriod;
            setValueIfExists(
                "onsetDateTime",
                DateTimePIO.parseFromString(start && convertDateJsToString(start)),
                subTree
            );
            setValueIfExists(
                "abatementDateTime",
                DateTimePIO.parseFromString(end && convertDateJsToString(end)),
                subTree
            );
        }
        if (medicalProblemCodeValueSet.getObjectByCodeSync(medicalProblemCode))
            writeCodingToSubTree(
                subTree,
                "code.coding",
                medicalProblemCodeValueSet.getObjectByCodeSync(medicalProblemCode)
            );
        if (
            medicalProblemClinicalStatus &&
            medicalProblemClinicalStatusValueSet.getObjectByCodeSync(medicalProblemClinicalStatus)
        )
            writeCodingToSubTree(
                subTree,
                "clinicalStatus.coding",
                medicalProblemClinicalStatusValueSet.getObjectByCodeSync(medicalProblemClinicalStatus)
            );
        if (medicalProblemSeverity && medicalProblemSeverityValueSet.getObjectByCodeSync(medicalProblemSeverity)) {
            const severityCoding: Coding | undefined =
                medicalProblemSeverityValueSet.getObjectByCodeSync(medicalProblemSeverity);
            if (severityCoding && !severityCoding.display) {
                //Write display value which is missing in value set
                const displayValues = {
                    "6736007": "Moderate",
                    "255604002": "Mild",
                    "24484000": "Severe (severity modifier)",
                };
                severityCoding.display =
                    severityCoding.code && Object.keys(displayValues).includes(severityCoding.code)
                        ? displayValues[severityCoding.code]
                        : "No matching display value found";
            }
            writeCodingToSubTree(subTree, "severity.coding", severityCoding);
        }
        if (
            medicalProblemVerificationStatus &&
            medicalProblemVerificationStatusValueSet.getObjectByCodeSync(medicalProblemVerificationStatus)
        )
            writeCodingToSubTree(
                subTree,
                "verificationStatus.coding",
                medicalProblemVerificationStatusValueSet.getObjectByCodeSync(medicalProblemVerificationStatus)
            );
        subTree?.setValue("subject.reference", UuidPIO.parseFromString(patientUUID));
        return subTree;
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        console.log(value);
        const findings: IMedicalProblemObject[] = value.MedicalProblemForm as IMedicalProblemObject[];
        onFinishMulti(
            medicalProblemFindingSubTrees,
            findings,
            updateSubTree,
            medicalProblemFindingPath,
            setMedicalProblemFindingSubTrees
        );
    };

    const getMedicalProblemLabel = (obj: IMedicalProblemObject): string => {
        try {
            const medicalProblemCodeLabel: string =
                medicalProblemCodeOptions.find(
                    (problem: SelectOption): boolean => problem.value === obj.medicalProblemCode
                )?.label ||
                obj.medicalProblemCode ||
                "Diagnose";
            const practitionerName: IFullNameObject | undefined = practitionerReduxState.find(
                (practitioner: IPractitionerObject): boolean => practitioner.id === obj.medicalProblemPerformer
            )?.practitionerName;
            const medicalProblemPerformerLabel: string = getNameLabel(practitionerName);
            const labels: string[] = [medicalProblemCodeLabel, medicalProblemPerformerLabel].filter(
                (label: string): boolean => label.trim() !== ""
            ); // Exclude empty strings

            return labels.join(", ");
        } catch {
            return "Label nicht initialisiert";
        }
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"MedicalProblemForm"} onFinish={onFinish} form={form}>
                <MultiWrapper<IMedicalProblemObject>
                    componentName={"MedicalProblemForm"}
                    SingleWrapper={MedicalProblemWrapper}
                    addText={"Neues medizinisches Problem/Diagnose hinzufügen"}
                    label={getMedicalProblemLabel}
                />
            </Form>
        </div>
    );
};
export default MedicalProblemForm;
