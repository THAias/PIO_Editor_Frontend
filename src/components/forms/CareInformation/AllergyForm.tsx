import {
    CodePIO,
    DateTimePIO,
    IAllergyObject,
    IResponse,
    ITimePeriodObject,
    StringPIO,
    SubTree,
    UriPIO,
    UuidPIO,
} from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import { Dayjs } from "dayjs";
import React, { useEffect } from "react";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import {
    checkCode,
    checkCoding,
    convertDateJsToString,
    convertStringToDayJs,
    writeCodingToSubTree,
} from "../../../services/HelperService";
import PIOService from "../../../services/PIOService";
import {
    deleteChildrenFromSubTree,
    extensionUrls,
    getChildrenFromSubTree,
    onFinishMulti,
    setValueIfExists,
    updateFindingState,
} from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import AllergyWrapper from "../../wrappers/AllergyWrapper";
import MultiWrapper from "../../wrappers/MultiWrapper";

/**
 * This form contains information about ONE allergy. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_AllergyIntolerance
 *
 * PIO-Small exclusions:
 * - extension.abatement-lebensphase-bis
 * - clinicalStatus
 * - verificationsStatus
 * - recorder
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const AllergyForm = (props: IFormProps): React.JSX.Element => {
    const allergyTypeValueSet: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/allergy-intolerance-type");
    const allergyCategoryValueSet: ValueSets = new ValueSets(
        "http://hl7.org/fhir/ValueSet/allergy-intolerance-category"
    );
    const allergyTypeOptions: SelectOptions = allergyTypeValueSet.getOptionsSync
        .map(
            (option: SelectOption): SelectOption => ({
                ...option,
                label: option.label.split(" ")[0],
            })
        )
        .concat({ label: "Keine Angabe", value: "undefined" });
    const allergyCategoryOptions: SelectOptions = allergyCategoryValueSet.getOptionsSync;
    const allergyFurtherInfoValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_Base_Allergy_Substance_SNOMED_CT"
    );

    //UUIDs and Paths
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const allergyFindingPath: string = "KBV_PR_MIO_ULB_AllergyIntolerance";
    const allergyFindingUUIDs: string[] | undefined = UUIDService.getUUIDs(allergyFindingPath);

    // States
    const [allergyFindingSubTrees, setAllergyFindingSubTrees] = React.useState<Record<string, SubTree>>({});

    const form = props.form;

    /** Initialize SubTrees and write existing values to Form fields */
    useEffect((): void => {
        if (!allergyFindingUUIDs || allergyFindingUUIDs.length === 0) return;

        const subTreePaths: string[] = allergyFindingUUIDs.map(
            (uuid: string): string => `${uuid}.${allergyFindingPath}`
        );
        PIOService.getSubTrees(subTreePaths)
            .then((result: IResponse): void => {
                if (!result.success || !result.data) return;
                const subTrees: SubTree[] = result.data?.subTrees as SubTree[];
                const fieldValues: IAllergyObject[] = subTrees.map((subTree: SubTree): IAllergyObject => {
                    const allergyId: string = subTree.absolutePath.split(".")[0];
                    const allergyCategory: string | undefined = checkCode(
                        subTree.getSubTreeByPath("category").getValueAsString(),
                        allergyCategoryOptions
                    );
                    const allergyCriticality: string | undefined = subTree
                        .getSubTreeByPath("criticality")
                        .getValueAsString();
                    const allergyType: string | undefined = subTree.getSubTreeByPath("type").getValueAsString();
                    const symptoms: string | undefined = subTree
                        .getSubTreeByPath("reaction.manifestation.text")
                        .getValueAsString();
                    const note: string | undefined = subTree.getSubTreeByPath("code.text").getValueAsString();
                    const furtherInfo: string | undefined = checkCoding(
                        subTree,
                        "code.coding",
                        allergyFurtherInfoValueSet.getOptionsSync
                    );
                    const start: Dayjs | undefined = convertStringToDayJs(
                        subTree.getSubTreeByPath("onsetDateTime").getValueAsString()
                    );
                    const extensionValue: string | undefined = getChildrenFromSubTree(subTree, "extension[")
                        ?.find(
                            (subSubTree: SubTree): boolean =>
                                subSubTree.data?.toString() === extensionUrls.allergyAbatement
                        )
                        ?.getSubTreeByPath("valueDateTime")
                        .getValueAsString();
                    const end: Dayjs | undefined = extensionValue ? convertStringToDayJs(extensionValue) : undefined;
                    return {
                        id: allergyId,
                        allergyCategory,
                        allergyCriticality,
                        allergyType,
                        symptoms,
                        note,
                        furtherInfo: furtherInfo || "",
                        timePeriod: {
                            start,
                            end,
                        },
                    };
                });
                form.setFieldValue(["AllergyFinding"], fieldValues);
                updateFindingState(subTrees, setAllergyFindingSubTrees);
            })
            .catch((error): void => {
                console.error("Error fetching subTrees:", error);
            });
    }, []);

    /**
     * Saves the data from the input fields and general values to the SubTree.
     * @param {SubTree} subTree SubTree to save the data to
     * @param {IAllergyObject} finding Object which holds the input data
     * @returns {SubTree} The modified SubTree
     */
    const updateSubTree = (subTree: SubTree, finding: IAllergyObject): SubTree => {
        subTree.deleteSubTreeByPath("");
        const {
            allergyCategory,
            allergyCriticality,
            allergyType,
            furtherInfo,
            note,
            symptoms,
            timePeriod,
        }: IAllergyObject = finding;
        setValueIfExists("category", CodePIO.parseFromString(allergyCategory), subTree);
        setValueIfExists("criticality", CodePIO.parseFromString(allergyCriticality), subTree);
        setValueIfExists("type", CodePIO.parseFromString(allergyType), subTree);
        setValueIfExists("reaction.manifestation.text", StringPIO.parseFromString(symptoms), subTree);
        setValueIfExists("code.text", StringPIO.parseFromString(note), subTree);
        setValueIfExists("patient.reference", UuidPIO.parseFromString(patientUUID), subTree);

        if (furtherInfo && allergyFurtherInfoValueSet.getObjectByCodeSync(furtherInfo))
            writeCodingToSubTree(subTree, "code.coding", allergyFurtherInfoValueSet.getObjectByCodeSync(furtherInfo));

        const setEndDateExtensionValue = (index: number, dateValue: Dayjs | undefined) => {
            subTree.setValue(`extension[${index}]`, new UriPIO(extensionUrls.allergyAbatement));
            setValueIfExists(
                `extension[${index}].valueDateTime`,
                DateTimePIO.parseFromString(dateValue && convertDateJsToString(dateValue)),
                subTree
            );
        };
        deleteChildrenFromSubTree(subTree, "extension[");
        deleteChildrenFromSubTree(subTree, "onsetDateTime");

        if (timePeriod) {
            const { start, end }: ITimePeriodObject = timePeriod;
            setValueIfExists(
                "onsetDateTime",
                DateTimePIO.parseFromString(start && convertDateJsToString(start)),
                subTree
            );
            const extensions: SubTree[] | undefined = getChildrenFromSubTree(subTree, "extension[");

            if (extensions && extensions.length > 0) {
                const abatementSubTreeIndex = extensions.findIndex(
                    (extension: SubTree) => extension.data?.toString() === extensionUrls.allergyAbatement
                );
                setEndDateExtensionValue(abatementSubTreeIndex ?? extensions.length, end);
            } else {
                if (end) setEndDateExtensionValue(0, end);
            }
        }
        return subTree;
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        const fieldValues: IAllergyObject[] = value.AllergyFinding as IAllergyObject[];
        onFinishMulti(
            allergyFindingSubTrees,
            fieldValues,
            updateSubTree,
            allergyFindingPath,
            setAllergyFindingSubTrees
        );
    };

    /**
     * Returns the label for the accordion panel for the given allergy object.
     * @param {IAllergyObject} allergyObject Allergy object
     * @returns {string} Label for the accordion panel
     */
    const getAllergyLabel = (allergyObject: IAllergyObject): string => {
        const allergyType: string =
            allergyTypeOptions.find(
                (type: SelectOption): boolean => type.value === allergyObject.allergyType && type.value !== "undefined"
            )?.label ?? "Allergie/Unverträglichkeit";
        const allergyCategory: string =
            allergyCategoryOptions.find((category: SelectOption) => category.value === allergyObject.allergyCategory)
                ?.label ?? "";
        return allergyType + (allergyCategory !== "" ? ` (${allergyCategory})` : "");
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"AllergyForm"} onFinish={onFinish} form={form}>
                <MultiWrapper<IAllergyObject>
                    componentName={"AllergyFinding"}
                    addText={"Neue Allergie/Unverträglichkeit hinzufügen"}
                    label={getAllergyLabel}
                    SingleWrapper={AllergyWrapper}
                />
            </Form>
        </div>
    );
};

export default AllergyForm;
