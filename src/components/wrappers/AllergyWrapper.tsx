import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React from "react";
import { v4 } from "uuid";

import { ISingleWrapperProps } from "../../@types/FormTypes";
import { helperTextAllergyWrapper } from "../../services/HelperTextService";
import ValueSets from "../../services/ValueSetService";
import InputDropDown from "../basic/InputDropDown";
import InputTextArea from "../basic/InputTextArea";
import InputTimePeriod from "../basic/InputTimePeriod";
import RadioButton from "../basic/RadioButton";

/**
 * This component wraps the form fields for a single allergy.
 * @param {ISingleWrapperProps} props ISingleWrapperProps props interface
 * @returns {React.JSX.Element} React element
 */
const AllergyWrapper = (props: ISingleWrapperProps): React.JSX.Element => {
    // ValueSets
    const allergyTypeValueSet: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/allergy-intolerance-type");
    const allergyTypeOptions: SelectOptions = allergyTypeValueSet.getOptionsSync.map(
        (option: SelectOption): SelectOption => ({
            ...option,
            label: option.label.split(" ")[0],
        })
    );
    const allergyCategoryValueSet: ValueSets = new ValueSets(
        "http://hl7.org/fhir/ValueSet/allergy-intolerance-category"
    );
    const allergyCategoryOptions: SelectOptions = allergyCategoryValueSet.getOptionsSync;
    const allergyCriticalityValueSet: ValueSets = new ValueSets(
        "http://hl7.org/fhir/ValueSet/allergy-intolerance-criticality"
    );
    const allergyCriticalityOptions: SelectOptions = allergyCriticalityValueSet.getOptionsSync;
    const allergyFurtherInfoValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_Base_Allergy_Substance_SNOMED_CT"
    );
    const allergyFurtherInfoOptions: SelectOptions = allergyFurtherInfoValueSet.getOptionsSync;

    return (
        <>
            <Form.Item name={props.name !== undefined ? [props.name, "id"] : "id"} hidden={true} initialValue={v4()}>
                <div style={{ display: "hidden" }} />
            </Form.Item>
            <div className={"form-line"}>
                <div className={"left"}>
                    <RadioButton
                        label={"Typ"}
                        name={props.name !== undefined ? [props.name, "allergyType"] : "allergyType"}
                        options={allergyTypeOptions}
                        helpText={helperTextAllergyWrapper.allergyType}
                    />
                </div>
                <div className={"right"}>
                    <InputTimePeriod
                        parentName={props.parentName}
                        name={props.name !== undefined ? [props.name, "timePeriod"] : "timePeriod"}
                        label={"Zeitraum Allergie (von/bis)"}
                        helpText={helperTextAllergyWrapper.timePeriod}
                    />
                </div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        label={"Kategorie"}
                        name={props.name !== undefined ? [props.name, "allergyCategory"] : "allergyCategory"}
                        options={allergyCategoryOptions}
                        placeholder={"Kategorie wählen"}
                    />
                </div>
                <div className={"right"}>
                    <RadioButton
                        label={"Wie kritisch?"}
                        name={props.name !== undefined ? [props.name, "allergyCriticality"] : "allergyCriticality"}
                        options={allergyCriticalityOptions}
                        helpText={helperTextAllergyWrapper.allergyCriticality}
                    />
                </div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        label={"Genauere Angaben"}
                        name={props.name !== undefined ? [props.name, "furtherInfo"] : "furtherInfo"}
                        options={allergyFurtherInfoOptions}
                        placeholder={"Angabe wählen"}
                        rules={[{ required: true, message: "Bitte eine Angabe zur Substanz tätigen!" }]}
                    />
                </div>
                <div className={"right"}>
                    <InputTextArea
                        name={props.name !== undefined ? [props.name, "symptoms"] : "symptoms"}
                        label={"Symptome"}
                        placeholder={"Ggf. Angaben zu Symptomen..."}
                        wide={true}
                    />
                </div>
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputTextArea
                        name={props.name !== undefined ? [props.name, "note"] : "note"}
                        label={"Beschreibung"}
                        placeholder={"Weitere Angaben bezüglich des Allergie Codes"}
                        wide={true}
                    />
                </div>
                <div className={"right"}></div>
            </div>
        </>
    );
};

export default AllergyWrapper;
