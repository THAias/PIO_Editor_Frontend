import { IResponse, StringPIO, SubTree, UuidPIO } from "@thaias/pio_editor_meta";
import { Coding, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React, { useEffect } from "react";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import {
    checkCoding,
    getUnsupportedCoding,
    writeCodingToSubTree,
    writeUnsupportedCodingToSubTree,
} from "../../../services/HelperService";
import PIOService from "../../../services/PIOService";
import { writeStaticFields } from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import InputDropDown from "../../basic/InputDropDown";
import InputTextArea from "../../basic/InputTextArea";

/**
 * This form contains information about striking behaviour. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Observation_Striking_Behavior
 *
 * PIO-Small exclusions:
 * - effectiveDateTime
 * - performer
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const StrikingBehaviorForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets and Options
    const strikingBehaviorValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Behavior_Finding"
    );
    const strikingBehaviorOptions: SelectOptions = strikingBehaviorValueSet.getOptionsSync;

    // UUIDs and Paths
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const behaviorPath: string = "KBV_PR_MIO_ULB_Observation_Striking_Behavior";

    // States
    const [behaviorSubTree, setBehaviorSubTree] = React.useState<SubTree[]>([]);
    const [behaviorNote, setBehaviorNote] = React.useState<string>("");
    const form = props.form;

    const coding = {
        system: "http://snomed.info/sct",
        version: "http://snomed.info/sct/900000000000207008/version/20220331",
        code: "363896009:704326004=25786006",
        display: "Behavior observable (observable entity) : Precondition (attribute) = Abnormal behavior (finding)",
    };

    /**
     * Function to write behaviorType data to input form fields, in order to reduce cognitive complexity.
     * @param {SubTree} subTrees SubTrees of resource KBV_PR_MIO_ULB_Observation_Striking_Behavior
     */
    const writeBehaviorDataToInputFields = (subTrees: SubTree[]): void => {
        const behaviorValues: string[] = [];
        let behaviorNotePart: string | undefined;
        let newNote: string = behaviorNote;
        subTrees.forEach((subTree: SubTree): void => {
            const codingSubTree: SubTree = subTree.getSubTreeByPath("valueCodeableConcept.coding");
            if (codingSubTree.children.length > 0) {
                const behaviorValue: string | undefined = checkCoding(codingSubTree, "", strikingBehaviorOptions);
                if (behaviorValue) behaviorValues.push(behaviorValue);
            }
            behaviorNotePart = subTree.getSubTreeByPath("valueCodeableConcept.text").getValueAsString();
            // Logic to fill note field with different text values, that differ from each other
            const splittedNote = newNote.split("\n");
            behaviorNotePart?.split("\n").forEach((element) => {
                if (element && element !== "" && !splittedNote.includes(element)) {
                    newNote += (newNote ? "\n" : "") + element;
                }
            });
        });
        setBehaviorNote(newNote);
        form.setFieldsValue({
            strikingBehaviorValue: behaviorValues,
            strikingBehaviorComment: newNote,
        });
    };

    /** Initialize SubTrees */
    useEffect((): void => {
        const behaviorUuids: string[] = UUIDService.getUUIDs(behaviorPath) || [];
        const behaviorSubTrees: SubTree[] = [];
        PIOService.getSubTrees(
            behaviorUuids.map((uuid: string): string => {
                return uuid + "." + behaviorPath;
            })
        ).then((result: IResponse): void => {
            if (result.success) {
                (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                    behaviorSubTrees.push(subTree);
                });
                setBehaviorSubTree(behaviorSubTrees);
                writeBehaviorDataToInputFields(behaviorSubTrees);
            }
        });
    }, []);

    /**
     * Saves the SubTree for a specific property.
     * @param {SubTree} subTree The SubTree to save data into.
     * @param {string} inputValue The Form code value to save into the SubTree.
     * @param {string} inputNote The Form note value to save into the SubTree.
     * @param {Coding} staticCoding The coding for the 'valueCodeableConcept.coding' property.
     */
    const saveSubTree = (
        subTree: SubTree,
        inputValue: string,
        inputNote: string | undefined,
        staticCoding: Coding | undefined
    ): void => {
        const unsupportedCoding = getUnsupportedCoding(
            inputValue,
            subTree.getSubTreeByPath("valueCodeableConcept.coding"),
            "",
            strikingBehaviorValueSet
        );

        //Write data to subTree
        subTree?.deleteSubTreeByPath("");
        const valueExists: boolean = inputValue !== undefined && inputValue !== "";
        const noteExists: boolean = inputNote !== undefined && inputNote !== "";
        if (valueExists) {
            const strikingCoding: Coding | undefined = strikingBehaviorValueSet.getObjectByCodeSync(inputValue);
            if (coding !== undefined) {
                writeCodingToSubTree(subTree, `valueCodeableConcept.coding`, strikingCoding);
            }
        }
        if (noteExists) subTree?.setValue("valueCodeableConcept.text", StringPIO.parseFromString(inputNote as string));
        if (valueExists || noteExists)
            // General values
            writeStaticFields(subTree, patientUUID, staticCoding as Coding, true);

        writeUnsupportedCodingToSubTree(
            subTree.getSubTreeByPath("valueCodeableConcept"),
            "coding",
            "",
            unsupportedCoding
        );
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    // eslint-disable-next-line sonarjs/cognitive-complexity
    const onFinish = (value: IFormFinishObject): void => {
        const newBehaviorSubTree: SubTree[] = [...behaviorSubTree];
        const behaviorNoteValue: string | undefined = value.strikingBehaviorComment as string | undefined;
        const promises: Promise<void>[] = [];
        const valueArray: string[] = (value.strikingBehaviorValue as Array<string>).map((element: string) => {
            const splitElement = element.split(" (nicht unterstützter Code: ");
            if (splitElement.length > 1) {
                return splitElement[1].split(")")[0];
            } else {
                return element;
            }
        });
        const deleteArray: SubTree[] = newBehaviorSubTree.filter((subTree: SubTree) => {
            return !valueArray.includes(
                subTree.getSubTreeByPath("valueCodeableConcept.coding.code").getValueAsString() as string
            );
        });
        let newSubTree = [...newBehaviorSubTree];
        if (deleteArray.length > 0) {
            promises.push(PIOService.deleteSubTrees(deleteArray).then((result: IResponse) => console.debug(result)));
            newSubTree = newBehaviorSubTree.filter((subTree: SubTree) => {
                return valueArray.includes(
                    subTree.getSubTreeByPath("valueCodeableConcept.coding.code").getValueAsString() as string
                );
            });
            newBehaviorSubTree.splice(0, newBehaviorSubTree.length);
            newBehaviorSubTree.push(...newSubTree);
        }
        (value.strikingBehaviorValue as Array<string>).forEach((typeValue: string): void => {
            const splitElement = typeValue.split(" (nicht unterstützter Code: ");
            let newTypeValue;
            if (splitElement.length > 1) {
                newTypeValue = splitElement[1].split(")")[0];
            } else {
                newTypeValue = typeValue;
            }
            const subTreeWithValue: SubTree | undefined = newSubTree.find(
                (subTree: SubTree): boolean =>
                    subTree.getSubTreeByPath("valueCodeableConcept.coding.code").getValueAsString() === newTypeValue
            );
            if (!subTreeWithValue) {
                const uuid: string = UuidPIO.generateUuid();
                UUIDService.setUUID(uuid, behaviorPath);
                const promise: Promise<void> = PIOService.getSubTrees([uuid + "." + behaviorPath]).then(
                    (result: IResponse): void => {
                        if (result.success) {
                            (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                                saveSubTree(subTree, typeValue, behaviorNoteValue, coding);
                                newBehaviorSubTree.push(subTree);
                            });
                        }
                    }
                );
                promises.push(promise);
            } else {
                saveSubTree(subTreeWithValue, typeValue, behaviorNoteValue, coding);
            }
        });

        //Write striking behaviour resource
        Promise.all(promises).then((result: void[]): void => {
            setBehaviorSubTree(newBehaviorSubTree);
            PIOService.saveSubTrees(newBehaviorSubTree).then((response: IResponse): void => {
                if (!response) console.debug(result);
            });
        });
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"StrikingBehaviorForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            placeholder={"Auffälliges Verhalten wählen"}
                            options={strikingBehaviorOptions}
                            multiple={true}
                            label={"Angaben zum auffälligen Verhalten"}
                            name={"strikingBehaviorValue"}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextArea
                            name={"strikingBehaviorComment"}
                            label={"Kommentar"}
                            placeholder={"Ggf. Ergänzungen zum auffälligen Verhalten..."}
                        />
                    </div>
                </div>
            </Form>
        </div>
    );
};

export default StrikingBehaviorForm;
