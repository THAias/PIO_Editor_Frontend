import { IResponse, SubTree } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React, { useEffect } from "react";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { writeCodingToSubTree } from "../../../services/HelperService";
import { helperTextLibertyForm } from "../../../services/HelperTextService";
import PIOService from "../../../services/PIOService";
import { writeStaticFields } from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import RadioButton from "../../basic/RadioButton";

/**
 * This form contains information about the deprivation liberty measures. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Observation_Deprivation_Liberty_Measures
 *
 * PIO-Small exclusions:
 * - effectiveDateTime
 * - performer
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const DeprivationOfLibertyForm = (props: IFormProps): React.JSX.Element => {
    // ValueSets and Options
    const libertyValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Constraint_Control_Seclusion"
    );
    const deprivationOfLibertyOptionsOrder: string[] = [
        "129125009:363589002=225214000,408730004=897015005",
        "129125009:363589002=225214000,408730004=410536001",
        "129125009:363589002=225214000,408730004=410537005",
    ];
    const deprivationOfLiberty: SelectOptions = libertyValueSet.getOptionsSync
        .map((option: SelectOption) => {
            switch (option.value) {
                case "129125009:363589002=225214000,408730004=410536001":
                    option.label = "Nicht notwendig";
                    break;
                case "129125009:363589002=225214000,408730004=410537005":
                    option.label = "Unbekannt";
                    break;
                case "129125009:363589002=225214000,408730004=897015005":
                    option.label = "Notwendig";
                    break;
            }
            return option;
        })
        .sort(
            (a: SelectOption, b: SelectOption) =>
                deprivationOfLibertyOptionsOrder.indexOf(a.value) - deprivationOfLibertyOptionsOrder.indexOf(b.value)
        );

    // UUIDs and Paths
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    const deprivationPath: string = "KBV_PR_MIO_ULB_Observation_Deprivation_Liberty_Measures";
    const deprivationUUID: string = UUIDService.getUUID(deprivationPath);

    // States
    const [deprivationSubTree, setDeprivationSubTree] = React.useState<SubTree>();
    const form = props.form;

    /** Initialize SubTrees and write existing values to Form fields */
    useEffect((): void => {
        PIOService.getSubTrees([deprivationUUID + "." + deprivationPath]).then((result: IResponse): void => {
            if (result.success)
                (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                    setDeprivationSubTree(subTree);
                    form.setFieldValue(
                        "deprivationOfLiberty",
                        subTree.getSubTreeByPath("valueCodeableConcept.coding.code").getValueAsString()
                    );
                });
        });
    }, []);

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        deprivationSubTree?.deleteSubTreeByPath("");
        if (value.deprivationOfLiberty) {
            writeCodingToSubTree(
                deprivationSubTree as SubTree,
                "valueCodeableConcept.coding",
                libertyValueSet.getObjectByCodeSync(value.deprivationOfLiberty as string)
            );
            writeStaticFields(
                deprivationSubTree as SubTree,
                patientUUID,
                {
                    system: "http://snomed.info/sct",
                    version: "http://snomed.info/sct/900000000000207008/version/20220331",
                    code: "363787002:704321009=225214000",
                    display:
                        "Observable entity (observable entity) : Characterizes (attribute) = Procedures relating to control, restraint, seclusion and segregation (procedure)",
                },
                true
            );
        }

        PIOService.saveSubTrees([deprivationSubTree as SubTree]).then((result: IResponse): void => {
            if (!result) console.error(result);
        });
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"LibertyForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <RadioButton
                            label={"Angaben zu Freiheitsentziehenden Maßnahmen"}
                            name={"deprivationOfLiberty"}
                            options={deprivationOfLiberty}
                            unknownOption={true}
                            helpText={helperTextLibertyForm.deprivationOfLiberty}
                        />
                    </div>
                </div>
            </Form>
        </div>
    );
};
export default DeprivationOfLibertyForm;
