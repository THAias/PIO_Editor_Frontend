import { DateTimePIO, IResponse, IRiskObject, SubTree, UuidPIO } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React, { useEffect } from "react";
import { validate } from "uuid";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import {
    checkCoding,
    convertDateJsToString,
    convertStringToDayJs,
    writeCodingToSubTree,
} from "../../../services/HelperService";
import PIOService from "../../../services/PIOService";
import {
    onFinishMulti,
    setValueIfExists,
    updateFindingState,
    writeStaticFields,
} from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import MultiWrapper from "../../wrappers/MultiWrapper";
import RiskWrapper from "../../wrappers/RiskWrapper";

/**
 * This form contains information about risks. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Observation_Presence_Risks (handled in Backend)
 * - KBV_PR_MIO_ULB_Observation_Risk
 *
 * PIO-Small:
 * - xxx
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const RiskForm = (props: IFormProps): React.JSX.Element => {
    const riskValueSet: ValueSets = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Risk");
    const riskOptions: SelectOptions = riskValueSet.getOptionsSync;

    // UUIDs and Paths
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const riskFindingPath: string = "KBV_PR_MIO_ULB_Observation_Risk";
    const riskFindingUUIDs: string[] | undefined = UUIDService.getUUIDs(riskFindingPath);

    // States
    const [riskFindingSubTrees, setRiskFindingSubTrees] = React.useState<Record<string, SubTree>>({});

    const form = props.form;

    /** Initialize SubTrees and write existing values to Form fields */
    useEffect((): void => {
        if (!riskFindingUUIDs || riskFindingUUIDs.length === 0) return;

        const subTreePaths: string[] = riskFindingUUIDs.map((uuid: string): string => `${uuid}.${riskFindingPath}`);
        PIOService.getSubTrees(subTreePaths)
            .then((result: IResponse): void => {
                if (!result.success || !result.data) return;
                const subTrees: SubTree[] = result.data?.subTrees as SubTree[];
                const fieldValues: IRiskObject[] = subTrees.map((subTree: SubTree): IRiskObject => {
                    const riskId: string = subTree.absolutePath.split(".")[0];
                    const riskValue: string | undefined = checkCoding(
                        subTree,
                        "valueCodeableConcept.coding",
                        riskOptions
                    );
                    const riskPerformer: string | undefined = subTree
                        .getSubTreeByPath("performer.reference")
                        .data?.get() as string | undefined;
                    const riskEffective: string | undefined = subTree
                        .getSubTreeByPath("effectiveDateTime")
                        .getValueAsString();

                    return {
                        id: riskId,
                        riskValue: riskValue || "",
                        riskPerformer: riskPerformer,
                        riskEffective: riskEffective ? convertStringToDayJs(riskEffective) : undefined,
                    };
                });
                form.setFieldValue(["RiskFinding"], fieldValues);
                updateFindingState(subTrees, setRiskFindingSubTrees);
            })
            .catch((error): void => {
                console.error("Error fetching subTrees:", error);
            });
    }, []);

    /**
     * Saves the data from the input fields and general values to the SubTree.
     * @param {SubTree} subTree SubTree to save the data to
     * @param {IRiskObject} finding Object which holds the input data
     * @returns {SubTree} The modified SubTree
     */
    const updateSubTree = (subTree: SubTree, finding: IRiskObject): SubTree => {
        const { riskValue, riskPerformer, riskEffective }: IRiskObject = finding;

        if (riskValue && riskValueSet.getObjectByCodeSync(riskValue))
            writeCodingToSubTree(subTree, "valueCodeableConcept.coding", riskValueSet.getObjectByCodeSync(riskValue));
        if (riskPerformer && validate(riskPerformer))
            setValueIfExists("performer.reference", UuidPIO.parseFromString(riskPerformer), subTree);
        setValueIfExists(
            "effectiveDateTime",
            riskEffective
                ? DateTimePIO.parseFromString(riskEffective && convertDateJsToString(riskEffective))
                : undefined,
            subTree
        );
        writeStaticFields(
            subTree,
            patientUUID,
            {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "80943009",
                display: "Risk factor (observable entity)",
            },
            true
        );

        return subTree;
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        const findings: IRiskObject[] = value.RiskFinding as IRiskObject[];
        onFinishMulti(riskFindingSubTrees, findings, updateSubTree, riskFindingPath, setRiskFindingSubTrees);
    };

    const getRiskLabel = (obj: IRiskObject): string => {
        const riskDisplayValue: string | undefined =
            riskOptions.find((risk: SelectOption): boolean => risk.value === obj.riskValue)?.label || obj.riskValue;
        return riskDisplayValue ?? "Risiko";
    };
    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"RiskForm"} onFinish={onFinish} form={form}>
                <MultiWrapper<IRiskObject>
                    componentName={"RiskFinding"}
                    addText={"Neues Risiko hinzufügen"}
                    label={getRiskLabel}
                    SingleWrapper={RiskWrapper}
                />
            </Form>
        </div>
    );
};

export default RiskForm;
