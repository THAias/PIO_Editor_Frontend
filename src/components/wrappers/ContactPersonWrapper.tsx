import { IAddressObject } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React from "react";
import { v4 } from "uuid";

import { ISingleWrapperProps } from "../../@types/FormTypes";
import { getAddressLabel } from "../../services/HelperService";
import ValueSets from "../../services/ValueSetService";
import InputDropDown from "../basic/InputDropDown";
import AddressWrapper from "./AddressWrapper";
import MultiWrapper from "./MultiWrapper";
import NameWrapper from "./NameWrapper";
import TelecomWrapper from "./TelecomWrapper";

const genderValueSet: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/administrative-gender");
const genderOtherValueSet: ValueSets = new ValueSets("http://fhir.de/ValueSet/gender-other-de");
const roleValueSet: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/relatedperson-relationshiptype");

/**
 * Wrapper component for contact persons. Can be used in a modal or MultiWrapper.
 * @param {ISingleWrapperProps} props ISingleWrapperProps props interface
 * @returns {React.JSX.Element} React element
 */
export const ContactPersonWrapper = (props: ISingleWrapperProps): React.ReactElement => {
    // ValueSets and options
    const genderOptions: SelectOptions = genderValueSet.getOptionsSync
        .filter((item: SelectOption): boolean => item.value !== "other")
        .concat(genderOtherValueSet.getOptionsSync);
    const roleOptions: SelectOptions = roleValueSet.getOptionsSync;

    return (
        <div className={"extended-form-line"}>
            <Form.Item name={props.name !== undefined ? [props.name, "id"] : "id"} hidden={true} initialValue={v4()}>
                <div style={{ display: "hidden" }} />
            </Form.Item>
            <div className={"form-line"}>
                <div className={"left"}>
                    <InputDropDown
                        label={"Verhältnis zu Patient:in"}
                        name={props.name !== undefined ? [props.name, "role"] : "role"}
                        options={roleOptions}
                        placeholder={"Verhältnis wählen"}
                    />
                </div>
                <div className={"right"}>
                    <InputDropDown
                        label={"Geschlecht"}
                        name={props.name !== undefined ? [props.name, "gender"] : "gender"}
                        options={genderOptions}
                        placeholder={"Geschlecht wählen"}
                    />
                </div>
            </div>
            <NameWrapper
                name={props.name !== undefined ? [props.name, "name"] : "name"}
                maidenName={false}
                parentName={props.parentName}
            />
            <TelecomWrapper
                name={props.name !== undefined ? [props.name, "telecom"] : "telecom"}
                parentName={props.parentName}
            />
            <MultiWrapper<IAddressObject>
                componentName={props.name !== undefined ? [props.name, "address"] : "address"}
                nestedWrapperParentLabel={props.parentName}
                SingleWrapper={AddressWrapper}
                addText={"Addresse hinzufügen"}
                label={getAddressLabel}
                fullPath={true}
            />
        </div>
    );
};
