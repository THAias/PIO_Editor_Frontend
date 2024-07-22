import { IResponse, SubTree } from "@thaias/pio_editor_meta";
import { SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React, { useEffect, useState } from "react";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { checkCoding, getKeyByValue, writeCodingToSubTree } from "../../../services/HelperService";
import { helperTextOrientationForm } from "../../../services/HelperTextService";
import PIOService from "../../../services/PIOService";
import { writeStaticFields } from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import InputDropDown from "../../basic/InputDropDown";
import RadioButton from "../../basic/RadioButton";

/**
 * This form contains information about cognitive awareness and orientation of patient. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Observation_Cognitive_Awareness
 * - KBV_PR_MIO_ULB_Observation_Orientation
 *
 * PIO-Small:
 * - xxx
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const OrientationForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets
    const cogAwarenessValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Cognitive_Awareness"
    );
    const cogAwarenessOptions: SelectOptions = cogAwarenessValueSet.getOptionsSync;
    const orientationTimeValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Orientation_Time"
    );
    const orientationPersonValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Orientation_Person"
    );
    const orientationPlaceValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Orientation_Place"
    );
    const orientationSituationValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Orientation_Situation"
    );

    // UUIDs and Paths
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const cognitiveAwarenessPath: string = "KBV_PR_MIO_ULB_Observation_Cognitive_Awareness";
    const cognitiveAwarenessUUID: string = UUIDService.getUUID(cognitiveAwarenessPath);
    const orientationPath: string = "KBV_PR_MIO_ULB_Observation_Orientation";
    const orientationUUID: string = UUIDService.getUUID(orientationPath);

    // States
    const [cognitiveAwarenessSubTree, setCognitiveAwarenessSubTree] = useState<SubTree>();
    const [orientationSubTree, setOrientationSubTree] = useState<SubTree>();
    const form = props.form;
    const staticOptions = [
        { label: "Vorhanden", value: "Vorhanden" },
        { label: "Reduziert", value: "Reduziert" },
        { label: "Keine Orientierung", value: "Keine Orientierung" },
    ];
    const optionCodeMap = {
        orientationTime: {
            Vorhanden: "426794005",
            Reduziert: "426794005:363713009=260400001",
            "Keine Orientierung": "19657006",
        },
        orientationPlace: {
            Vorhanden: "427161009",
            Reduziert: "427161009:363713009=260400001",
            "Keine Orientierung": "72440003",
        },
        orientationPerson: {
            Vorhanden: "427645006",
            Reduziert: "427645006:363713009=260400001",
            "Keine Orientierung": "62766000",
        },
        orientationSituation: {
            Vorhanden: "247663003",
            Reduziert: "247663003:363713009=260400001",
            "Keine Orientierung": "62476001+385337002",
        },
    };

    const setOrientationFields = (subTree: SubTree): void => {
        const orientationObject = {
            orientationTime: undefined,
            orientationPlace: undefined,
            orientationPerson: undefined,
            orientationSituation: undefined,
        };
        subTree.children
            .filter((child: SubTree) => child.lastPathElement.includes("component"))
            .forEach((component: SubTree): void => {
                component.children.forEach((coding: SubTree): void => {
                    if (coding.lastPathElement === "valueCodeableConcept") {
                        const code: string = coding.getSubTreeByPath("coding.code").getValueAsString() ?? "";
                        if (code === undefined) return;
                        Object.keys(optionCodeMap).forEach((key: string): void => {
                            const keyForValue: string | undefined = getKeyByValue(optionCodeMap[key.toString()], code);
                            if (keyForValue !== undefined) {
                                orientationObject[key.toString()] = keyForValue;
                            }
                        });
                    }
                });
            });
        form.setFieldsValue(orientationObject);
    };

    useEffect((): void => {
        PIOService.getSubTrees([
            cognitiveAwarenessUUID + "." + cognitiveAwarenessPath,
            orientationUUID + "." + orientationPath,
        ]).then((result: IResponse): void => {
            if (result.success) {
                (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                    if (subTree.lastPathElement === cognitiveAwarenessPath) {
                        form.setFieldValue(
                            "cogAwareness",
                            checkCoding(subTree, "valueCodeableConcept.coding", cogAwarenessOptions)
                        );
                        setCognitiveAwarenessSubTree(subTree);
                    } else {
                        setOrientationFields(subTree);
                        setOrientationSubTree(subTree);
                    }
                });
            }
        });
    }, []);
    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        //Cognitive awareness resource
        if (
            !value.cogAwareness ||
            (value.cogAwareness && cogAwarenessValueSet.getObjectByCodeSync(value.cogAwareness as string))
        ) {
            cognitiveAwarenessSubTree?.deleteSubTreeByPath("");
            if (value.cogAwareness) {
                writeCodingToSubTree(
                    cognitiveAwarenessSubTree as SubTree,
                    "valueCodeableConcept.coding",
                    cogAwarenessValueSet.getObjectByCodeSync(value.cogAwareness as string)
                );
                writeStaticFields(
                    cognitiveAwarenessSubTree as SubTree,
                    patientUUID,
                    {
                        system: "http://snomed.info/sct",
                        version: "http://snomed.info/sct/900000000000207008/version/20220331",
                        code: "312012004",
                        display: "Cognitive function: awareness (observable entity)",
                    },
                    true
                );
            }
        }

        //Orientation resource
        orientationSubTree?.deleteSubTreeByPath("");
        let counter: number = 0;
        if (value.orientationTime) {
            writeCodingToSubTree(orientationSubTree as SubTree, `component[${counter}].code.coding`, {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "405017007:370130000=410669006",
                display:
                    "Ability to identify person, place, and time (observable entity): Property (attribute) = Time (property) (qualifier value)",
            });
            writeCodingToSubTree(
                orientationSubTree as SubTree,
                `component[${counter}].valueCodeableConcept.coding`,
                orientationTimeValueSet.getObjectByCodeSync(
                    optionCodeMap.orientationTime[value.orientationTime as string]
                )
            );
            counter++;
        }
        if (value.orientationPerson) {
            writeCodingToSubTree(orientationSubTree as SubTree, `component[${counter}].code.coding`, {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "405017007+160476009",
                display:
                    "Ability to identify person, place, and time (observable entity) + Social / personal history observable (observable entity)",
            });
            writeCodingToSubTree(
                orientationSubTree as SubTree,
                `component[${counter}].valueCodeableConcept.coding`,
                orientationPersonValueSet.getObjectByCodeSync(
                    optionCodeMap.orientationPerson[value.orientationPerson as string]
                )
            );
            counter++;
        }
        if (value.orientationPlace) {
            writeCodingToSubTree(orientationSubTree as SubTree, `component[${counter}].code.coding`, {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "405017007+302149003",
                display:
                    "Ability to identify person, place, and time (observable entity) + Housing, local environment and transport detail (observable entity)",
            });
            writeCodingToSubTree(
                orientationSubTree as SubTree,
                `component[${counter}].valueCodeableConcept.coding`,
                orientationPlaceValueSet.getObjectByCodeSync(
                    optionCodeMap.orientationPlace[value.orientationPlace as string]
                )
            );
            counter++;
        }
        if (value.orientationSituation) {
            writeCodingToSubTree(orientationSubTree as SubTree, `component[${counter}].code.coding`, {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "43173001+395659009",
                display: "Orientation, function (observable entity) + Ability to comprehend (observable entity)",
            });
            writeCodingToSubTree(
                orientationSubTree as SubTree,
                `component[${counter}].valueCodeableConcept.coding`,
                orientationSituationValueSet.getObjectByCodeSync(
                    optionCodeMap.orientationSituation[value.orientationSituation as string]
                )
            );
            counter++;
        }
        if (counter > 0)
            writeStaticFields(
                orientationSubTree as SubTree,
                patientUUID,
                {
                    system: "http://snomed.info/sct",
                    version: "http://snomed.info/sct/900000000000207008/version/20220331",
                    code: "43173001",
                    display: "Orientation, function (observable entity)",
                },
                true
            );

        PIOService.saveSubTrees([cognitiveAwarenessSubTree as SubTree, orientationSubTree as SubTree]).then(
            (result: IResponse): void => {
                if (!result) console.error(result);
            }
        );
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"OrientationForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputDropDown
                            name={"cogAwareness"}
                            label={"Bewusstseinslage"}
                            placeholder={"Bewusstseinlage wählen"}
                            options={cogAwarenessOptions}
                            searchable={true}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <RadioButton
                            label={"Zeitliche Orientierung"}
                            name={"orientationTime"}
                            options={[...staticOptions]}
                            helpText={helperTextOrientationForm.orientationTime}
                        />
                    </div>
                    <div className={"right"}>
                        <RadioButton
                            label={"Personenbezogene Orientierung"}
                            name={"orientationPerson"}
                            options={[...staticOptions]}
                            helpText={helperTextOrientationForm.orientationPerson}
                        />
                    </div>
                </div>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <RadioButton
                            label={"Örtliche Orientierung"}
                            name={"orientationPlace"}
                            options={[...staticOptions]}
                            helpText={helperTextOrientationForm.orientationPlace}
                        />
                    </div>
                    <div className={"right"}>
                        <RadioButton
                            label={"Situative Orientierung"}
                            name={"orientationSituation"}
                            options={[...staticOptions]}
                            helpText={helperTextOrientationForm.orientationSituation}
                        />
                    </div>
                </div>
            </Form>
        </div>
    );
};

export default OrientationForm;
