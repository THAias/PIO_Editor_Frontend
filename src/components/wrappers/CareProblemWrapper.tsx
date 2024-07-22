import { SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React from "react";
import { v4 } from "uuid";

import { ISingleWrapperProps } from "../../@types/FormTypes";
import ValueSets from "../../services/ValueSetService";
import InputDatePicker from "../basic/InputDatePicker";
import InputDropDown from "../basic/InputDropDown";
import InputTextArea from "../basic/InputTextArea";

/**
 * This component wraps the form fields for a single care problem.
 * @param {ISingleWrapperProps} props ISingleWrapperProps props interface
 * @returns {React.JSX.Element} React element
 */
const CareProblemWrapper = (props: ISingleWrapperProps): React.JSX.Element => {
    const careProblemCodeValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Diagnosis_ICNP"
    );
    const careProblemCodeOptions: SelectOptions = careProblemCodeValueSet.getOptionsSync;

    return (
        <>
            <Form.Item name={props.name !== undefined ? [props.name, "id"] : "id"} hidden={true} initialValue={v4()}>
                <div style={{ display: "hidden" }} />
            </Form.Item>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        name={props.name !== undefined ? [props.name, "careProblemCode"] : "careProblemCode"}
                        label={"Diagnosebezeichnung"}
                        placeholder={"Diagnosebezeichnung wählen"}
                        options={careProblemCodeOptions}
                        rules={[{ required: true, message: "Bitte wählen Sie eine Diagnose aus!" }]}
                    />
                </div>
                <div className={"right"}>
                    <InputDatePicker
                        name={props.name !== undefined ? [props.name, "careProblemOnset"] : "careProblemOnset"}
                        label={"Datum"}
                        placeholder={"Datum auswählen"}
                        future={true}
                    />
                </div>
            </div>
            <div className={"form-line"}>
                <div className={"left"} />
                <div className={"right"}>
                    <InputTextArea
                        name={props.name !== undefined ? [props.name, "careProblemComment"] : "careProblemComment"}
                        label={"Kommentar"}
                        placeholder={"Ggf. Ergänzungen zum Pflegeproblem/Diagnose..."}
                    />
                </div>
            </div>
        </>
    );
};

export default CareProblemWrapper;
