import { IResponse, SubTree } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React, { useEffect } from "react";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { writeCodingToSubTree } from "../../../services/HelperService";
import PIOService from "../../../services/PIOService";
import { writeStaticFields } from "../../../services/SubTreeHelperService";
import UUIDService from "../../../services/UUIDService";
import ValueSets from "../../../services/ValueSetService";
import RadioButton from "../../basic/RadioButton";

/**
 * This form contains information about pains. Following FHIR resource is used:
 * - KBV_PR_MIO_ULB_Observation_Information_Medicines
 *
 * PIO-Small excludes following values:
 * - extension:naehereInformationen
 * - effectiveDateTime
 * - performer.reference
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const MedicinesInformationForm = (props: IFormProps): React.JSX.Element => {
    const medicinesValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Information_Medication"
    );
    const medicinesValueSetOptionsOrder: string[] = [
        "309298003:363713009=52101004",
        "242571000000102",
        "309298003:363713009=373068000",
    ];
    const medicinesValueSetOptions: SelectOptions = medicinesValueSet.getOptionsSync
        .map((option: SelectOption) => {
            switch (option.value) {
                case "309298003:363713009=52101004":
                    option.label = "Einnahme von Medikamenten";
                    break;
                case "242571000000102":
                    option.label = "Keine Einnahme";
                    break;
                case "309298003:363713009=373068000":
                    option.label = "Unbekannt";
                    break;
            }
            return option;
        })
        .sort(
            (a: SelectOption, b: SelectOption) =>
                medicinesValueSetOptionsOrder.indexOf(a.value) - medicinesValueSetOptionsOrder.indexOf(b.value)
        );

    //UUIDs of the SubTree
    const medicinesSubTreePath: string = "KBV_PR_MIO_ULB_Observation_Information_Medicines";
    const medicinesUUID: string = UUIDService.getUUID(medicinesSubTreePath);
    const patientUUID: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
    //SubTree State
    const [medicinesSubTree, setMedicinesSubTree] = React.useState<SubTree>();
    const form = props.form;

    /** Initialize SubTrees */
    useEffect(() => {
        PIOService.getSubTrees([medicinesUUID + "." + medicinesSubTreePath]).then((result: IResponse): void => {
            if (result.success)
                (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree): void => {
                    setMedicinesSubTree(subTree);
                    const medicineValue: string | undefined = subTree
                        .getSubTreeByPath("valueCodeableConcept.coding.code")
                        .getValueAsString();
                    form.setFieldValue("medicineValue", medicineValue);
                });
        });
    }, []);

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        medicinesSubTree?.deleteSubTreeByPath("");
        if (value.medicineValue !== undefined) {
            writeCodingToSubTree(
                medicinesSubTree as SubTree,
                "valueCodeableConcept.coding",
                medicinesValueSet.getObjectByCodeSync(value.medicineValue as string)
            );
            // Setting general values
            writeStaticFields(
                medicinesSubTree as SubTree,
                patientUUID,
                {
                    system: "http://snomed.info/sct",
                    version: "http://snomed.info/sct/900000000000207008/version/20220331",
                    code: "363819003",
                    display: "Drug therapy observable (observable entity)",
                },
                true
            );
        }

        PIOService.saveSubTrees([medicinesSubTree as SubTree]).then((result: IResponse): void => {
            if (!result) console.debug(result);
        });
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"MedicinesInfoForm"} onFinish={onFinish} form={form}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <RadioButton options={medicinesValueSetOptions} name={"medicineValue"} label={"Typ"} />
                    </div>
                    <div className={"right"}>
                        <div className={"info-card"}>
                            <div className={"info-card-content"}>
                                <b>Nähere Informationen sind im Arztbrief zu finden.</b>
                                <br />
                                Falls der Patient Medikamente einnimmt, bitte den Arztbrief oder den Medikationsplan im
                                Reiter Organisatorisches & Soziales als Datei hochladen.
                            </div>
                        </div>
                    </div>
                </div>
            </Form>
        </div>
    );
};
export default MedicinesInformationForm;
