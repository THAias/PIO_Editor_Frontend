import { SelectOptions } from "@thaias/pio_fhir_resources";
import { Form, FormInstance } from "antd";
import React, { useEffect } from "react";

import { ISingleWrapperProps } from "../../@types/FormTypes";
import { getFullPath } from "../../services/HelperService";
import { helperTextAddressWrapper } from "../../services/HelperTextService";
import ValueSets from "../../services/ValueSetService";
import "../../styles/layout/layoutForm.scss";
import InputDropDown from "../basic/InputDropDown";
import InputNumericField from "../basic/InputNumericField";
import InputTextField from "../basic/InputTextField";
import RadioButton from "../basic/RadioButton";

const addressTypeValueSets: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/address-use");
const countryCodesValueSets: ValueSets = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Deuev_Anlage_8");

/**
 * Wrapper component for addresses. Can be used in a modal or MultiWrapper.
 * @param {ISingleWrapperProps} props ISingleAddressProps props interface
 * @returns {React.JSX.Element} React element
 */
const AddressWrapper = (props: ISingleWrapperProps): React.ReactElement => {
    //ValueSets and options
    const addressTypeOptions: SelectOptions = addressTypeValueSets.getOptionsSync;
    const countryCodesOptions: SelectOptions = countryCodesValueSets.getOptionsSync;

    //Form instance and watchers
    const form: FormInstance = Form.useFormInstance();
    const postBoxRadioWatcher = Form.useWatch(
        props.name !== undefined ? getFullPath(props).concat("postOfficeBoxRadio") : "postOfficeBoxRadio",
        form
    );
    const streetWatcher = Form.useWatch(
        props.name !== undefined ? getFullPath(props).concat("street") : "street",
        form
    );

    /** Resets input fields postOfficeBoxNumber, street, houseNumber, additionalLocator, if Radio Button is changed. */
    useEffect((): void => {
        if (postBoxRadioWatcher === "true") {
            //Clear street address input fields
            form.setFieldValue(props.name !== undefined ? getFullPath(props).concat("street") : "street", undefined);
            form.setFieldValue(
                props.name !== undefined ? getFullPath(props).concat("houseNumber") : "houseNumber",
                undefined
            );
            form.setFieldValue(
                props.name !== undefined ? getFullPath(props).concat("additionalLocator") : "additionalLocator",
                undefined
            );
        } else if (postBoxRadioWatcher === "false") {
            //Clear post office box input field
            form.setFieldValue(
                props.name !== undefined ? getFullPath(props).concat("postOfficeBoxNumber") : "postOfficeBoxNumber",
                undefined
            );
        }
    }, [postBoxRadioWatcher]);

    /** Sets the PostBoxRadioButton to 'Nein' if a street name is entered. */
    useEffect((): void => {
        if (postBoxRadioWatcher === undefined && streetWatcher !== undefined) {
            form.setFieldValue(
                props.name !== undefined ? getFullPath(props).concat("postOfficeBoxRadio") : "postOfficeBoxRadio",
                "false"
            );
        }
    }, [streetWatcher]);

    /**
     * Content to render if address type is a normal address
     * @returns {React.JSX.Element} React element
     */
    const getStreetAddressInputFields = (): React.JSX.Element => (
        <>
            <div className={"left"}>
                <InputTextField
                    name={props.name !== undefined ? [props.name, "street"] : "street"}
                    label={"Straße"}
                    placeholder={"Straßenname eingeben ..."}
                />
                <InputTextField
                    name={props.name !== undefined ? [props.name, "houseNumber"] : "houseNumber"}
                    label={"Hausnummer"}
                    wide={false}
                    placeholder={"Nr."}
                />
            </div>
            <div className={"right"}>
                <InputTextField
                    name={props.name !== undefined ? [props.name, "additionalLocator"] : "additionalLocator"}
                    label={"Adresszusatz"}
                    placeholder={"Ggf. Stockwerk, o.ä..."}
                />
            </div>
        </>
    );

    /**
     * Content to render if address type is a post office box
     * @returns {React.JSX.Element} React element
     */
    const getPostOfficeBoxInputField = (): React.JSX.Element => (
        <div className={"left"}>
            <InputNumericField
                name={props.name !== undefined ? [props.name, "postOfficeBoxNumber"] : "postOfficeBoxNumber"}
                label={"Postfach"}
                wide={false}
                placeholder={"Postfach"}
                rules={[{ required: postBoxRadioWatcher === "true", message: "Bitte eine Nummer eingeben!" }]}
            />
        </div>
    );

    return (
        <div className={"extended-form-line"}>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        name={props.name !== undefined ? [props.name, "use"] : "use"}
                        label={"Adressart"}
                        options={addressTypeOptions}
                        placeholder={"Adressart auswählen"}
                    />
                </div>
                <div className={"right"}>
                    <RadioButton
                        name={props.name !== undefined ? [props.name, "postOfficeBoxRadio"] : "postOfficeBoxRadio"}
                        label={"Postfachadresse?"}
                        options={[
                            { label: "Ja", value: "true" },
                            { label: "Nein", value: "false" },
                        ]}
                        unknownOption={false}
                        helpText={helperTextAddressWrapper.postOfficeBoxRadio}
                        rules={[{ required: true, message: "Bitte eine Adressart auswählen!" }]}
                    />
                </div>
            </div>
            <div className={"form-line"}>
                {postBoxRadioWatcher === "true" ? getPostOfficeBoxInputField() : getStreetAddressInputFields()}
            </div>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputNumericField
                        name={props.name !== undefined ? [props.name, "postalCode"] : "postalCode"}
                        label={"Postleitzahl"}
                        wide={false}
                        placeholder={"PLZ"}
                    />
                    <InputTextField
                        name={props.name !== undefined ? [props.name, "city"] : "city"}
                        label={"Ort"}
                        placeholder={"Passend zur Postleitzahl"}
                    />
                </div>
                <div className={"right"}>
                    <InputTextField
                        name={props.name !== undefined ? [props.name, "district"] : "district"}
                        label={"Stadtteil"}
                        placeholder={"optional"}
                        wide={false}
                    />
                </div>
            </div>
            <div className={"form-line"}>
                <InputDropDown
                    name={props.name !== undefined ? [props.name, "country"] : "country"}
                    label={"Land"}
                    options={countryCodesOptions}
                    placeholder={"Land auswählen ..."}
                />
            </div>
        </div>
    );
};

export default AddressWrapper;
