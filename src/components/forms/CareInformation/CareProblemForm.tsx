import { DateTimePIO, ICareProblemObject, IResponse, MarkdownPIO, SubTree, UuidPIO } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import { Dayjs } from "dayjs";
import React, { useEffect } from "react";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import {
    checkCoding,
    convertDateJsToString,
    convertStringToDayJs,
    writeCodingToSubTree,
} from "../../../services/HelperService";
import PIOService from "../../../services/PIOService";
import { onFinishMulti, setValueIfExists, updateFindingState } from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import CareProblemWrapper from "../../wrappers/CareProblemWrapper";
import MultiWrapper from "../../wrappers/MultiWrapper";

/**
 * This form contains information about the care problems. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Condition_Care_Problem
 * - KBV_PR_MIO_ULB_Observation_Presence_Problems (handled in Backend)
 *
 * PIO-Small exclusions:
 * - KBV_PR_MIO_ULB_Condition_Care_Problem
 *      - extension:anlassUrsache
 * - KBV_PR_MIO_ULB_Observation_Presence_Problems (handled in Backend)
 *     - extension:naehereInformationen
 *     - effectiveDateTime
 *     - performer.reference
 *     - valueCodeableConcept.coding only present or absent (no unknown)
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const CareProblemForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets and Options
    const careProblemCodeValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Diagnosis_ICNP"
    );
    const careProblemCodeOptions: SelectOptions = careProblemCodeValueSet.getOptionsSync;

    // UUIDs and Paths
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const careProblemFindingPath: string = "KBV_PR_MIO_ULB_Condition_Care_Problem";
    const careProblemFindingUUIDs: string[] | undefined = UUIDService.getUUIDs(careProblemFindingPath);

    // States
    const [careProblemFindingSubTrees, setCareProblemFindingSubTrees] = React.useState<Record<string, SubTree>>({});
    const form = props.form;

    /** Initialize SubTrees and write existing values to Form fields */
    useEffect((): void => {
        if (!careProblemFindingUUIDs || careProblemFindingUUIDs.length === 0) return;

        const subTreePaths: string[] = careProblemFindingUUIDs.map(
            (uuid: string): string => `${uuid}.${careProblemFindingPath}`
        );
        PIOService.getSubTrees(subTreePaths)
            .then((result: IResponse): void => {
                if (!result.success || !result.data) return;

                const subTrees: SubTree[] = result.data?.subTrees as SubTree[];
                const fieldValues: ICareProblemObject[] = subTrees.map((subTree: SubTree): ICareProblemObject => {
                    const careProblemId: string = subTree.absolutePath.split(".")[0];
                    const careProblemCode: string | undefined = checkCoding(
                        subTree,
                        "code.coding",
                        careProblemCodeOptions
                    );

                    const careProblemComment: string | undefined = subTree
                        .getSubTreeByPath("note.text")
                        ?.getValueAsString();
                    const dateValue: string | undefined = subTree.getSubTreeByPath("onsetDateTime")?.getValueAsString();
                    const careProblemOnset: Dayjs | undefined = dateValue ? convertStringToDayJs(dateValue) : undefined;
                    return {
                        id: careProblemId,
                        careProblemCode: careProblemCode || "",
                        careProblemComment: careProblemComment,
                        careProblemOnset: careProblemOnset,
                    };
                });
                form.setFieldValue(["CareProblemForm"], fieldValues);
                updateFindingState(subTrees, setCareProblemFindingSubTrees);
            })
            .catch((error): void => {
                console.error("Error fetching subTrees:", error);
            });
    }, []);

    /**
     * Saves the data from the input fields and general values to the SubTree.
     * @param {SubTree} subTree SubTree to save the data to
     * @param {ICareProblemObject} finding Object which holds the input data
     * @returns {SubTree} The modified SubTree
     */
    const updateSubTree = (subTree: SubTree, finding: ICareProblemObject): SubTree => {
        const { careProblemCode, careProblemComment, careProblemOnset }: ICareProblemObject = finding;
        subTree.deleteSubTreeByPath("");

        if (careProblemCode && careProblemCodeValueSet.getObjectByCodeSync(careProblemCode))
            writeCodingToSubTree(subTree, "code.coding", careProblemCodeValueSet.getObjectByCodeSync(careProblemCode));
        setValueIfExists("note.text", MarkdownPIO.parseFromString(careProblemComment), subTree);
        setValueIfExists(
            "onsetDateTime",
            careProblemOnset
                ? DateTimePIO.parseFromString(careProblemOnset && convertDateJsToString(careProblemOnset))
                : undefined,
            subTree
        );
        // General values
        setValueIfExists("subject.reference", UuidPIO.parseFromString(patientUUID), subTree);
        writeCodingToSubTree(subTree, "category.coding", {
            system: "http://snomed.info/sct",
            version: "http://snomed.info/sct/900000000000207008/version/20220331",
            code: "439401001:704326004=86644006",
            display: "Diagnosis (observable entity) : Precondition (attribute) = Nursing diagnosis (finding)",
        });
        return subTree;
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        const findings: ICareProblemObject[] = value.CareProblemForm as ICareProblemObject[];

        onFinishMulti(
            careProblemFindingSubTrees,
            findings,
            updateSubTree,
            careProblemFindingPath,
            setCareProblemFindingSubTrees
        );
    };

    const getItemLabel = (obj: ICareProblemObject): string => {
        return (
            careProblemCodeOptions.find((problem: SelectOption): boolean => problem.value === obj.careProblemCode)
                ?.label ?? obj.careProblemCode
        );
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"CareProblemForm"} onFinish={onFinish} form={form}>
                <MultiWrapper<ICareProblemObject>
                    componentName={"CareProblemForm"}
                    SingleWrapper={CareProblemWrapper}
                    addText={"Neues Pflegeproblem/Diagnose hinzufügen"}
                    label={getItemLabel}
                />
            </Form>
        </div>
    );
};

export default CareProblemForm;
