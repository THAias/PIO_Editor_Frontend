import { IImplantObject, IResponse, MarkdownPIO, SubTree, UriPIO, UuidPIO } from "@thaias/pio_editor_meta";
import { Form } from "antd";
import React, { useEffect } from "react";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { checkCoding, getImplantLabel, writeCodingToSubTree } from "../../../services/HelperService";
import PIOService from "../../../services/PIOService";
import {
    extensionUrls,
    onFinishMulti,
    setValueIfExists,
    updateFindingState,
} from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import ImplantWrapper from "../../wrappers/ImplantWrapper";
import MultiWrapper from "../../wrappers/MultiWrapper";

/**
 * This form contains information about ONE implant. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Device_Implant
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const ImplantForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets and Options
    const medicalDeviceValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Medical_Device"
    );
    // UUIDs and Paths
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const implantPath: string = "KBV_PR_MIO_ULB_Device_Implant";
    const implantUUIDs: string[] | undefined = UUIDService.getUUIDs(implantPath);

    //States
    const [implantSubTrees, setImplantSubTrees] = React.useState<Record<string, SubTree>>({});
    const form = props.form;

    useEffect(() => {
        if (!implantUUIDs || implantUUIDs.length === 0) return;
        PIOService.getSubTrees(implantUUIDs.map((uuid: string): string => `${uuid}.${implantPath}`)).then(
            (result: IResponse): void => {
                if (!result.success || !result.data) return;
                const fieldValues: IImplantObject[] = (result.data?.subTrees as SubTree[]).map(
                    (subTree: SubTree): IImplantObject => {
                        return {
                            id: subTree.absolutePath.split(".")[0],
                            implantType: checkCoding(subTree, "type.coding", medicalDeviceValueSet.getOptionsSync),
                            comment: subTree.getSubTreeByPath("note.text").getValueAsString(),
                        };
                    }
                );
                form.setFieldValue(["implant"], fieldValues);
                updateFindingState(result.data.subTrees as SubTree[], setImplantSubTrees);
            }
        );
    }, []);

    /**
     * Saves the data from the input fields and general values to the SubTree.
     * @param {SubTree} subTree SubTree to save the data to
     * @param {IImplantObject} implant Object which holds the input data
     * @returns {SubTree} The modified SubTree
     */
    const updateSubTree = (subTree: SubTree, implant: IImplantObject): SubTree => {
        if (implant.implantType && medicalDeviceValueSet.getObjectByCodeSync(implant.implantType))
            writeCodingToSubTree(
                subTree,
                "type.coding",
                medicalDeviceValueSet.getObjectByCodeSync(implant.implantType)
            );
        setValueIfExists("note.text", MarkdownPIO.parseFromString(implant.comment), subTree);
        if (implant.implantType || implant.comment) {
            writeCodingToSubTree(subTree, "extension[0].valueCodeableConcept.coding", {
                system: "http://snomed.info/sct",
                version: "http://snomed.info/sct/900000000000207008/version/20220331",
                code: "40388003",
                display: "Implant, device (physical object)",
            });
            subTree.setValue("extension[0]", UriPIO.parseFromString(extensionUrls.implant));
            subTree.setValue("patient.reference", UuidPIO.parseFromString(patientUUID));
        }
        return subTree;
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        const fieldValues: IImplantObject[] = value.implant as IImplantObject[];
        onFinishMulti(implantSubTrees, fieldValues, updateSubTree, implantPath, setImplantSubTrees);
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"ImplantForm"} onFinish={onFinish} form={form}>
                <MultiWrapper
                    componentName={"implant"}
                    SingleWrapper={ImplantWrapper}
                    addText={"Neues Implantat hinzufügen"}
                    label={getImplantLabel}
                />
            </Form>
        </div>
    );
};

export default ImplantForm;
