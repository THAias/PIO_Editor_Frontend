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
 * This form contains information about food. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Observation_Food_Type
 * - KBV_PR_MIO_ULB_Observation_Food_Administration_Form
 * - KBV_PR_MIO_ULB_Observation_Presence_Information_Nutrition (Handled in Backend)
 *
 * PIO-Small excludes following values:
 * - KBV_PR_MIO_ULB_Observation_Food_Type
 *      - extension:anlassUrsache
 *      - extension:geraetenutzung
 *      - effectiveDateTime
 *      - performer.reference
 * - KBV_PR_MIO_ULB_Observation_Food_Administration_Form
 *     - extension:anlassUrsache
 *     - extension:geraetenutzung
 *     - effectiveDateTime
 *     - performer.reference
 * - KBV_PR_MIO_ULB_Observation_Presence_Information_Nutrition (Handled in Backend)
 *     - effectiveDateTime
 *     - performer.reference
 *     - valueCodeableConcept.coding only present or absent (no unknown)
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const FoodTypeForm = (props: IFormProps): React.JSX.Element => {
    //Options and ValueSets
    const foodTypeValueSet: ValueSets = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Food_Type");
    const foodTypeValueSetOptions: SelectOptions = foodTypeValueSet.getOptionsSync;
    const foodAdministrationValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Food_Administration_Form"
    );
    const foodAdministrationValueSetOptions = foodAdministrationValueSet.getOptionsSync;

    //UUIDs
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const foodTypePath: string = "KBV_PR_MIO_ULB_Observation_Food_Type";
    const foodAdministrationPath: string = "KBV_PR_MIO_ULB_Observation_Food_Administration_Form";

    // States
    const [foodTypeSubTree, setFoodTypeSubTree] = React.useState<SubTree[]>([]);
    const [foodAdministrationSubTree, setFoodAdministrationSubTree] = React.useState<SubTree[]>([]);
    const form = props.form;

    /**
     * Function to write foodType or foodAdministration data to input form fields, in order to reduce cognitive complexity.
     * @param {SubTree} subTrees SubTrees of resource KBV_PR_MIO_ULB_Observation_Food_Type or KBV_PR_MIO_ULB_Observation_Food_Administration_Form
     * @param {string} propertyName property of either foodType or foodAdministration
     */
    // eslint-disable-next-line sonarjs/cognitive-complexity
    const writeFoodDataToInputFields = (subTrees: SubTree[], propertyName: "foodType" | "administrationType"): void => {
        let noteString: string = "";
        const foodValueSet: SelectOptions =
            propertyName === "foodType" ? foodTypeValueSetOptions : foodAdministrationValueSetOptions;
        const foodValues: string[] = [];
        let foodNote: string | undefined;
        subTrees.forEach((subTree: SubTree): void => {
            const codingSubTree: SubTree = subTree.getSubTreeByPath("valueCodeableConcept.coding");
            if (codingSubTree.children.length > 0) {
                const foodValue: string | undefined = checkCoding(codingSubTree, "", foodValueSet);
                if (foodValue) foodValues.push(foodValue);
            }
            foodNote = subTree.getSubTreeByPath("valueCodeableConcept.text").getValueAsString();
            // Logic to fill note field with different text values, that differ from each other
            const splittedNote = noteString.split("\n");
            foodNote?.split("\n").forEach((element) => {
                if (element && element !== "" && !splittedNote.includes(element)) {
                    noteString += (noteString ? "\n" : "") + element;
                }
            });
        });
        if (propertyName === "foodType") {
            form.setFieldsValue({
                foodTypeValue: foodValues,
                foodTypeNote: noteString,
            });
        } else {
            form.setFieldsValue({
                foodAdministrationValue: foodValues,
                foodAdministrationNote: noteString,
            });
        }
    };

    /** Initialize SubTrees and write existing values to Form fields */
    useEffect((): void => {
        const foodTypeUuids: string[] = UUIDService.getUUIDs(foodTypePath) || [];
        const foodAdministrationUuids: string[] = UUIDService.getUUIDs(foodAdministrationPath) || [];
        const foodTypeSubTrees: SubTree[] = [];
        const foodAdministrationSubTrees: SubTree[] = [];
        PIOService.getSubTrees(
            foodTypeUuids
                .map((uuid: string): string => {
                    return uuid + "." + foodTypePath;
                })
                .concat(
                    foodAdministrationUuids.map((uuid: string): string => {
                        return uuid + "." + foodAdministrationPath;
                    })
                )
        ).then((result: IResponse): void => {
            if (result.success) {
                (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                    switch (subTree.lastPathElement) {
                        case foodTypePath:
                            foodTypeSubTrees.push(subTree);
                            break;
                        case foodAdministrationPath:
                            foodAdministrationSubTrees.push(subTree);
                            break;
                        default:
                            break;
                    }
                });
                setFoodTypeSubTree(foodTypeSubTrees);
                writeFoodDataToInputFields(foodTypeSubTrees, "foodType");
                setFoodAdministrationSubTree(foodAdministrationSubTrees);
                writeFoodDataToInputFields(foodAdministrationSubTrees, "administrationType");
            }
        });
    }, []);

    /**
     * Saves the SubTree for a specific property.
     * @param {SubTree} subTree The SubTree to save data into.
     * @param {string} propertyName The name of the property to save data into.
     * @param {string} inputValue The Form code value to save into the SubTree.
     * @param {string} inputNote The Form note value to save into the SubTree.
     * @param {Coding} staticCoding The coding for the 'valueCodeableConcept.coding' property.
     */
    const saveSubTree = (
        subTree: SubTree,
        propertyName: string,
        inputValue: string,
        inputNote: string | undefined,
        staticCoding: Coding | undefined
    ): void => {
        const unsupportedCoding = getUnsupportedCoding(
            inputValue,
            subTree.getSubTreeByPath("valueCodeableConcept.coding"),
            "",
            propertyName === "foodType" ? foodTypeValueSet : foodAdministrationValueSet
        );

        //Write data to subTree
        subTree?.deleteSubTreeByPath("");
        const valueExists: boolean = inputValue !== undefined && inputValue !== "";
        const noteExists: boolean = inputNote !== undefined && inputNote !== "";
        if (valueExists) {
            const coding: Coding | undefined =
                propertyName === "foodType"
                    ? foodTypeValueSet.getObjectByCodeSync(inputValue)
                    : foodAdministrationValueSet.getObjectByCodeSync(inputValue);
            if (coding !== undefined) {
                writeCodingToSubTree(subTree, `valueCodeableConcept.coding`, coding);
            }
        }
        if (noteExists) subTree?.setValue("valueCodeableConcept.text", StringPIO.parseFromString(inputNote));
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
     * Checks if SubTrees of array of SubTrees corresponds to given input values.
     * Deletes SubTrees that are not listed correspondingly to the input values.
     * Creates new SubTrees for given input values that have to corresponding SubTree yet.
     * Updates existing SubTrees (note will be written in every SubTree when added)
     * @param {SubTree[]} foodSubTree The array of SubTrees that is checked and updated.
     * @param {Promise[]} promises Array of promises to make a final call once all promises inside are fulfilled.
     * @param {IFormFinishObject} value Object which holds the input data.
     * @param {Coding | undefined} coding Object containing information of either foodType of foodAdministration.
     * @param {string | undefined} noteValue Input note of either foodType or foodAdministration.
     * @param {string} propertyName Type decleration of foodType or foodAdministrationValue
     * @param {string} path corresponding path of foodType or foodAdministration
     */
    const updateSubTree = (
        foodSubTree: SubTree[],
        promises: Promise<void>[],
        value: IFormFinishObject,
        coding: Coding | undefined,
        noteValue: string | undefined,
        propertyName: "foodType" | "foodAdministration",
        path: string
    ): void => {
        const key: string = propertyName === "foodType" ? "foodTypeValue" : "foodAdministrationValue";
        const valueArray: string[] = (value[key.toString()] as Array<string>).map((element: string) => {
            const splitElement = element.split(" (nicht unterstützter Code: ");
            if (splitElement.length > 1) {
                return splitElement[1].split(")")[0];
            } else {
                return element;
            }
        });
        const deleteArray: SubTree[] = foodSubTree.filter((subTree: SubTree) => {
            return !valueArray.includes(
                subTree.getSubTreeByPath("valueCodeableConcept.coding.code").getValueAsString() as string
            );
        });
        let newSubTree = [...foodSubTree];
        if (deleteArray.length > 0) {
            promises.push(PIOService.deleteSubTrees(deleteArray).then((result: IResponse) => console.debug(result)));
            newSubTree = foodSubTree.filter((subTree: SubTree) => {
                return valueArray.includes(
                    subTree.getSubTreeByPath("valueCodeableConcept.coding.code").getValueAsString() as string
                );
            });
            foodSubTree.splice(0, foodSubTree.length);
            foodSubTree.push(...newSubTree);
        }
        (value[key.toString()] as Array<string>).forEach((typeValue: string): void => {
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
                UUIDService.setUUID(uuid, path);
                const promise: Promise<void> = PIOService.getSubTrees([uuid + "." + path]).then(
                    (result: IResponse): void => {
                        if (result.success) {
                            (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                                saveSubTree(subTree, propertyName, typeValue, noteValue, coding);
                                foodSubTree.push(subTree);
                            });
                        }
                    }
                );
                promises.push(promise);
            } else {
                saveSubTree(subTreeWithValue, propertyName, typeValue, noteValue, coding);
            }
        });
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        const foodTypeCoding: Coding | undefined = {
            system: "http://snomed.info/sct",
            version: "http://snomed.info/sct/900000000000207008/version/20220331",
            code: "230092000",
            display: "General food types intake (observable entity)",
        };
        const foodAdministrationCoding: Coding | undefined = {
            system: "http://snomed.info/sct",
            version: "http://snomed.info/sct/900000000000207008/version/20220331",
            code: "129007004",
            display: "Feeding (observable entity)",
        };
        const newFoodTypeSubTree: SubTree[] = [...foodTypeSubTree];
        const newAdministrationSubTree: SubTree[] = [...foodAdministrationSubTree];
        const foodTypeNoteValue: string | undefined = value.foodTypeNote as string | undefined;
        const foodAdministrationNoteValue: string | undefined = value.foodAdministrationNote as string | undefined;
        const promises: Promise<void>[] = [];
        updateSubTree(newFoodTypeSubTree, promises, value, foodTypeCoding, foodTypeNoteValue, "foodType", foodTypePath);
        updateSubTree(
            newAdministrationSubTree,
            promises,
            value,
            foodAdministrationCoding,
            foodAdministrationNoteValue,
            "foodAdministration",
            foodAdministrationPath
        );

        Promise.all(promises).then((result: void[]): void => {
            setFoodTypeSubTree(newFoodTypeSubTree);
            writeFoodDataToInputFields(newFoodTypeSubTree, "foodType");
            setFoodAdministrationSubTree(newAdministrationSubTree);
            writeFoodDataToInputFields(newAdministrationSubTree, "administrationType");
            PIOService.saveSubTrees(newFoodTypeSubTree.concat(newAdministrationSubTree)).then(
                (response: IResponse): void => {
                    if (!response) console.debug(result);
                }
            );
        });
    };

    return (
        <div onBlur={form.submit} tabIndex={0}>
            <Form layout={"vertical"} name={"FoodTypeForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            name={"foodTypeValue"}
                            label={"Kostform"}
                            multiple={true}
                            placeholder={"Kostform auswählen..."}
                            options={foodTypeValueSetOptions}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextArea
                            name={"foodTypeNote"}
                            label={"Kommentar"}
                            placeholder={"Ggf. Ergänzungen zur Kostform..."}
                            helpText={
                                "Es muss mindestens eine Kostform ausgewählt werden, damit ein Kommentar geschrieben werden kann."
                            }
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            name={"foodAdministrationValue"}
                            label={"Kostdarreichungsform"}
                            multiple={true}
                            placeholder={"Kostdarreichungsform auswählen..."}
                            options={foodAdministrationValueSetOptions}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextArea
                            name={"foodAdministrationNote"}
                            label={"Kommentar"}
                            placeholder={"Ggf. Ergänzungen zur Kostdarreichungsform..."}
                            helpText={
                                "Es muss mindestens eine Kostdarreichungsform ausgewählt werden, damit ein Kommentar geschrieben werden kann."
                            }
                        />
                    </div>
                </div>
            </Form>
        </div>
    );
};

export default FoodTypeForm;
