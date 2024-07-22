import {
    CodePIO,
    DateTimePIO,
    DecimalPIO,
    IResponse,
    ITimePeriodObject,
    MarkdownPIO,
    StringPIO,
    SubTree,
    UnsignedIntegerPIO,
    UriPIO,
    UuidPIO,
} from "@thaias/pio_editor_meta";
import { Coding, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React, { useEffect } from "react";
import { validate } from "uuid";

import { IFormFinishObject, IFormProps, INursingMeasures } from "../../../@types/FormTypes";
import {
    checkCode,
    checkCoding,
    convertDateJsToString,
    convertStringToDayJs,
    writeCodingToSubTree,
} from "../../../services/HelperService";
import PIOService from "../../../services/PIOService";
import {
    extensionUrls,
    getUuidFromValue,
    onFinishMulti,
    setValueIfExists,
    updateFindingState,
    writeStaticFields,
} from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import MultiWrapper from "../../wrappers/MultiWrapper";
import NursingMeasuresWrapper from "../../wrappers/NursingMeasuresWrapper";

/**
 * This form contains information about the care problems. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Procedure_Nursing_Measures
 *
 * PIO-Small exclusions:
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const NursingMeasuresForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets and Options
    const nursingMeasuresValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Interventions_ICNP"
    );
    const timeInstanceValueSet: ValueSets = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Event_Timing");
    const timeUnitValueSet: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/units-of-time");
    const durationOptions: SelectOptions = [
        { label: "Minuten", value: "min" },
        { label: "Stunden", value: "h" },
        { label: "Tage", value: "d" },
    ];

    // UUIDs and Paths
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const nursingMeasuresPath: string = "KBV_PR_MIO_ULB_Procedure_Nursing_Measures";
    const nursingMeasuresUUIDs: string[] | undefined = UUIDService.getUUIDs(nursingMeasuresPath);

    // States
    const [nursingMeasuresSubTrees, setNursingMeasuresSubTrees] = React.useState<Record<string, SubTree>>({});
    const form = props.form;

    const getFieldValues = (subTrees: SubTree[]): INursingMeasures[] => {
        return subTrees.map((subTree: SubTree): INursingMeasures => {
            const id: string = subTree.absolutePath.split(".")[0];
            const measure: string | undefined = checkCoding(
                subTree,
                "code.coding",
                nursingMeasuresValueSet.getOptionsSync
            );
            const comment: string | undefined = subTree.getSubTreeByPath("note.text")?.getValueAsString();
            const startDate: string | undefined = subTree.getSubTreeByPath("performedPeriod.start")?.getValueAsString();
            const endDate: string | undefined = subTree.getSubTreeByPath("performedPeriod.end")?.getValueAsString();
            const performer: string | undefined = getUuidFromValue(
                subTree.getSubTreeByPath("performer.actor.reference").getValueAsString()
            );
            // Extensions
            const extensionParent: SubTree | undefined = subTree
                .getSubTreeByPath("extension")
                .children?.find((mainExtension: SubTree): boolean => {
                    return mainExtension.getValueAsString() === extensionUrls.nursingMeasures;
                })
                ?.children?.find((subExtension: SubTree): boolean => {
                    return subExtension.getValueAsString() === "angabeStrukturiert";
                });
            const extensionValues: {
                timeInstance?: string;
                frequency?: string;
                period?: string;
                periodUnit?: string;
                durationValue?: string;
                durationUnit?: string;
            } = {};
            extensionParent?.children.forEach((extension: SubTree): void => {
                switch (extension.getValueAsString()) {
                    case "zeitpunkt":
                        extensionValues.timeInstance = checkCoding(
                            extension.getSubTreeByPath("valueTiming.code.coding"),
                            "",
                            timeInstanceValueSet.getOptionsSync
                        );
                        break;
                    case "frequenz":
                        extensionValues.frequency = extension
                            .getSubTreeByPath("valueTiming.repeat.frequency")
                            ?.getValueAsString();
                        extensionValues.period = extension
                            .getSubTreeByPath("valueTiming.repeat.period")
                            ?.getValueAsString();
                        extensionValues.periodUnit = checkCode(
                            extension.getSubTreeByPath("valueTiming.repeat.periodUnit").getValueAsString(),
                            timeUnitValueSet.getOptionsSync
                        );
                        break;
                    case "dauer":
                        extensionValues.durationValue = extension
                            .getSubTreeByPath("valueQuantity.value")
                            ?.getValueAsString();
                        extensionValues.durationUnit = checkCode(
                            extension.getSubTreeByPath("valueQuantity.unit")?.getValueAsString(),
                            durationOptions
                        );
                        break;
                    default:
                        break;
                }
            });
            return {
                id: id,
                measure: measure as string,
                comment: comment,
                timePeriod: {
                    start: startDate ? convertStringToDayJs(startDate) : undefined,
                    end: endDate ? convertStringToDayJs(endDate) : undefined,
                },
                performer: performer,
                timeInstance: extensionValues.timeInstance,
                frequency: extensionValues.frequency,
                period: extensionValues.period,
                periodUnit: extensionValues.periodUnit,
                durationValue: extensionValues.durationValue,
                durationUnit: extensionValues.durationUnit,
            };
        });
    };

    /** Initialize SubTrees and write existing values to Form fields */
    useEffect((): void => {
        if (!nursingMeasuresUUIDs || nursingMeasuresUUIDs.length === 0) return;

        const subTreePaths: string[] = nursingMeasuresUUIDs.map(
            (uuid: string): string => `${uuid}.${nursingMeasuresPath}`
        );
        PIOService.getSubTrees(subTreePaths)
            .then((result: IResponse): void => {
                if (!result.success || !result.data) return;
                const subTrees: SubTree[] = result.data?.subTrees as SubTree[];
                const fieldValues: INursingMeasures[] = getFieldValues(subTrees);
                form.setFieldValue(["nursingMeasures"], fieldValues);
                updateFindingState(subTrees, setNursingMeasuresSubTrees);
            })
            .catch((error): void => {
                console.error("Error fetching subTrees:", error);
            });
    }, []);

    /**
     * Saves the data from the input fields and general values to the SubTree.
     * @param {SubTree} subTree SubTree to save the data to
     * @param {INursingMeasures} finding Object which holds the input data
     * @returns {SubTree} The modified SubTree
     */
    // eslint-disable-next-line sonarjs/cognitive-complexity
    const updateSubTree = (subTree: SubTree, finding: INursingMeasures): SubTree => {
        if (finding.measure === undefined) return subTree;
        const {
            measure,
            timePeriod,
            timeInstance,
            frequency,
            durationUnit,
            durationValue,
            period,
            periodUnit,
            comment,
            performer,
        }: INursingMeasures = finding;
        subTree.deleteSubTreeByPath("");

        // Resource values
        const measureCoding: Coding | undefined = nursingMeasuresValueSet.getObjectByCodeSync(measure);
        setValueIfExists("note.text", MarkdownPIO.parseFromString(comment), subTree);
        if (performer && validate(performer))
            setValueIfExists("performer.actor.reference", UuidPIO.parseFromString(performer), subTree);
        const { start, end } = timePeriod as ITimePeriodObject;
        setValueIfExists(
            "performedPeriod.start",
            DateTimePIO.parseFromString(start && convertDateJsToString(start)),
            subTree
        );
        setValueIfExists(
            "performedPeriod.end",
            DateTimePIO.parseFromString(end && convertDateJsToString(end)),
            subTree
        );
        // Extension values
        let extCounter: number = 0;
        const timeExt: boolean = timeInstance !== undefined;
        const freqExt: boolean = frequency !== undefined && period !== undefined && periodUnit !== undefined;
        const durationExt: boolean = durationValue !== undefined && durationUnit !== undefined;
        if (timeExt || freqExt || durationExt) {
            subTree.setValue("extension[0]", new UriPIO(extensionUrls.nursingMeasures));
            subTree.setValue("extension[0].extension[0]", new UriPIO("codeSnomed"));
            writeCodingToSubTree(subTree, "extension[0].extension[0].valueCodeableConcept.coding", {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "364713004",
                display: "Temporal observable (observable entity)",
            });
            subTree.setValue("extension[0].extension[1]", new UriPIO("angabeStrukturiert"));
        }
        if (timeExt) {
            const path: string = `extension[0].extension[1].extension[${extCounter}]`;
            subTree.setValue(path, new UriPIO("zeitpunkt"));
            writeCodingToSubTree(
                subTree,
                path + ".valueTiming.code.coding",
                timeInstanceValueSet.getObjectByCodeSync(timeInstance as string)
            );
            extCounter++;
        }
        if (freqExt) {
            const path: string = `extension[0].extension[1].extension[${extCounter}]`;
            subTree.setValue(path, new UriPIO("frequenz"));
            subTree.setValue(
                path + ".valueTiming.repeat.frequency",
                UnsignedIntegerPIO.parseFromString(frequency as string)
            );
            subTree.setValue(path + ".valueTiming.repeat.period", DecimalPIO.parseFromString(period as string));
            subTree.setValue(path + ".valueTiming.repeat.periodUnit", CodePIO.parseFromString(periodUnit as string));
            extCounter++;
        }
        if (durationExt) {
            const path: string = `extension[0].extension[1].extension[${extCounter}]`;
            subTree.setValue(path, new UriPIO("dauer"));
            subTree.setValue(path + ".valueQuantity.value", DecimalPIO.parseFromString(durationValue as string));
            subTree.setValue(path + ".valueQuantity.unit", StringPIO.parseFromString(durationUnit as string));
            subTree.setValue(path + ".valueQuantity.code", CodePIO.parseFromString(durationUnit as string));
            subTree.setValue(path + ".valueQuantity.system", UriPIO.parseFromString("http://unitsofmeasure.org"));
        }
        // General values
        writeStaticFields(subTree, patientUUID, measureCoding, false);
        subTree?.setValue("status", CodePIO.parseFromString("completed"));
        return subTree;
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        const findings: INursingMeasures[] = value.nursingMeasures as INursingMeasures[];
        onFinishMulti(
            nursingMeasuresSubTrees,
            findings,
            updateSubTree,
            nursingMeasuresPath,
            setNursingMeasuresSubTrees
        );
    };

    const getItemLabel = (obj: INursingMeasures): string => {
        const label: string | undefined =
            nursingMeasuresValueSet.getObjectByCodeSync(obj.measure)?.display ?? obj.measure;
        return label ? label : "Pflegerische Maßnahme";
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"NursingMeasuresForm"} onFinish={onFinish} form={form}>
                <MultiWrapper<INursingMeasures>
                    componentName={"nursingMeasures"}
                    SingleWrapper={NursingMeasuresWrapper}
                    addText={"Neue pflegerische Maßnahme hinzufügen"}
                    label={getItemLabel}
                />
            </Form>
        </div>
    );
};

export default NursingMeasuresForm;
