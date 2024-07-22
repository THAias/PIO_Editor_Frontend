import { IResponse, MarkdownPIO, SubTree } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React, { useEffect } from "react";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { writeCodingToSubTree } from "../../../services/HelperService";
import PIOService from "../../../services/PIOService";
import { writeStaticFields } from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import InputTextArea from "../../basic/InputTextArea";
import RadioButton from "../../basic/RadioButton";

/**
 * This form contains information about pains. Following FHIR resource is used:
 * - KBV_PR_MIO_ULB_Observation_Pain
 *
 * PIO-Small excludes following values:
 * - extension:anlassUrsache
 * - effectiveDateTime
 * - performer.reference
 * - hasMember.reference
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const PainForm = (props: IFormProps): React.JSX.Element => {
    const painCodeValueSet: ValueSets = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Pain_Symptom");
    const painCodeValueSetOptionsOrder: string[] = [
        "22253000",
        "81765008",
        "413350009:{246090004=22253000,408729009=261665006,408732007=410604004,408731000=410512000}",
    ];
    const painCodeValueSetOptions: SelectOptions = painCodeValueSet.getOptionsSync
        .map((option: SelectOption) => {
            switch (option.value) {
                case "22253000":
                    option.label = "Liegt vor";
                    break;
                case "81765008":
                    option.label = "Liegt nicht vor";
                    break;
                case "413350009:{246090004=22253000,408729009=261665006,408732007=410604004,408731000=410512000}":
                    option.label = "Unbekannt";
                    break;
            }
            return option;
        })
        .sort(
            (a: SelectOption, b: SelectOption) =>
                painCodeValueSetOptionsOrder.indexOf(a.value) - painCodeValueSetOptionsOrder.indexOf(b.value)
        );

    //UUIDs of the SubTree
    const painSubTreePath: string = "KBV_PR_MIO_ULB_Observation_Pain";
    const painUUID: string = UUIDService.getUUID(painSubTreePath);
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    //SubTree State
    const [painSubTree, setPainSubTree] = React.useState<SubTree>();
    const form = props.form;
    const [required, setRequired] = React.useState<boolean>(false);
    const watchedField = Form.useWatch(["painNote"], form);

    useEffect((): void => {
        if (watchedField) {
            setRequired(true);
        } else {
            setRequired(false);
            form.setFields([
                { name: "painNote", value: undefined },
                { name: "painValue", errors: [] },
            ]);
        }
    }, [watchedField]);

    /** Initialize SubTrees */
    useEffect(() => {
        PIOService.getSubTrees([painUUID + "." + painSubTreePath]).then((result: IResponse): void => {
            if (result.success)
                (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                    setPainSubTree(subTree);
                    const painValue: string | undefined = subTree
                        .getSubTreeByPath("valueCodeableConcept.coding.code")
                        ?.getValueAsString();
                    const painNote: string | undefined = subTree.getSubTreeByPath("note.text")?.getValueAsString();
                    form.setFieldsValue({ painValue: painValue, painNote: painNote });
                });
        });
    }, []);

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        painSubTree?.deleteSubTreeByPath("");
        if (value.painValue !== undefined)
            writeCodingToSubTree(
                painSubTree as SubTree,
                "valueCodeableConcept.coding",
                painCodeValueSet.getObjectByCodeSync(value.painValue as string)
            );
        if (value.painNote !== undefined)
            painSubTree?.setValue("note.text", MarkdownPIO.parseFromString(value.painNote as string));
        if (value.painValue !== undefined || (value.painNote !== undefined && value.painNote !== "")) {
            // Setting general values
            writeStaticFields(
                painSubTree as SubTree,
                patientUUID,
                {
                    system: "http://snomed.info/sct",
                    version: "http://snomed.info/sct/900000000000207008/version/20220331",
                    code: "406189006",
                    display: "Pain observable (observable entity)",
                },
                true
            );
        }

        PIOService.saveSubTrees([painSubTree as SubTree]).then((result: IResponse): void => {
            if (!result) console.debug(result);
        });
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"PainForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <RadioButton
                            options={painCodeValueSetOptions}
                            name={"painValue"}
                            label={"Schmerzsymptomatik"}
                            rules={[{ required: required, message: "Bitte wählen Sie eine Schmerzsymptomatik aus!" }]}
                        />
                    </div>
                    <div className={"right"}>
                        <InputTextArea
                            name={"painNote"}
                            label={"Kommentar"}
                            placeholder={"Ggf. Ergänzungen zu Schmerzsymptomatik..."}
                        />
                    </div>
                </div>
            </Form>
        </div>
    );
};
export default PainForm;
