import { SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React from "react";
import { v4 } from "uuid";

import { ISingleWrapperProps } from "../../@types/FormTypes";
import ValueSets from "../../services/ValueSetService";
import InputDropDown from "../basic/InputDropDown";
import InputTextArea from "../basic/InputTextArea";

/**
 * This form contains information about ONE implant. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Device_Implant
 * @param {ISingleWrapperProps} props ISingleWrapperProps props interface
 * @returns {React.JSX.Element} React element
 */
const ImplantWrapper = (props: ISingleWrapperProps): React.JSX.Element => {
    // ValueSets
    const implantTypeValueSet: ValueSets = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Medical_Device");
    const implantTypeOptions: SelectOptions = implantTypeValueSet.getOptionsSync;

    return (
        <>
            <Form.Item name={props.name !== undefined ? [props.name, "id"] : "id"} hidden={true} initialValue={v4()}>
                <div style={{ display: "hidden" }} />
            </Form.Item>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        name={props.name !== undefined ? [props.name, "implantType"] : "implantType"}
                        label={"Implantattyp"}
                        placeholder={"Implantat wählen"}
                        options={implantTypeOptions}
                        searchable={true}
                        rules={[{ required: true, message: "Bitte wählen Sie einen Implantattyp aus!" }]}
                    />
                </div>
                <div className={"right"}>
                    <InputTextArea
                        name={props.name !== undefined ? [props.name, "comment"] : "comment"}
                        label={"Kommentar"}
                        placeholder={"Ggf. Ergänzende Angaben zu Implantat..."}
                    />
                </div>
            </div>
        </>
    );
};

export default ImplantWrapper;
