import { IContactPersonObject } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { AppDispatch, RootState } from "../../../@types/ReduxTypes";
import contactPersonActions from "../../../redux/actions/ContactPersonActions";
import { getNameLabel } from "../../../services/HelperService";
import ValueSets from "../../../services/ValueSetService";
import "../../../styles/layout/layoutForm.scss";
import { ContactPersonWrapper } from "../../wrappers/ContactPersonWrapper";
import MultiWrapper from "../../wrappers/MultiWrapper";

/**
 * This form contains information about multiple contact person. Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_RelatedPerson_Contact_Person
 *
 * PIO-Small:
 * - Plain text option for relationship.text not supported
 * - extension:Hinweis not supported
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const ContactPersonForm = (props: IFormProps): React.JSX.Element => {
    const roleValueSet: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/relatedperson-relationshiptype");
    const roleOptions: SelectOptions = roleValueSet.getOptionsSync;

    const dispatch: AppDispatch = useDispatch();
    const contactPersonsReduxState: IContactPersonObject[] = useSelector(
        (state: RootState) => state.contactPersonState
    );
    const form = props.form;

    /** Initialize Redux. */
    useEffect((): void => {
        if (contactPersonsReduxState) form.setFieldsValue({ contactPersons: contactPersonsReduxState });
    }, [contactPersonsReduxState]);

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        const contactPersons: IContactPersonObject[] = value.contactPersons as IContactPersonObject[];

        // Create sets for faster lookups
        const contactPersonsSet: Set<string> = new Set(
            contactPersons
                .filter((cp: IContactPersonObject): boolean => cp.id !== undefined)
                .map((cp: IContactPersonObject) => cp.id)
        );
        const reduxContactPersonsSet: Set<string> = new Set(
            contactPersonsReduxState
                ?.filter((cp: IContactPersonObject): boolean => cp.id !== undefined)
                .map((cp: IContactPersonObject) => cp.id)
        );

        if (contactPersonsSet.size > reduxContactPersonsSet.size) {
            // Add new contact persons to Redux state
            const contactPersonsToAdd: IContactPersonObject[] = contactPersons.filter(
                (cp: IContactPersonObject) => !reduxContactPersonsSet.has(cp.id)
            );
            contactPersonsToAdd.forEach((contactPerson: IContactPersonObject): void => {
                dispatch(contactPersonActions.addContactPersonRedux(contactPerson));
            });
        } else if (contactPersonsSet.size < reduxContactPersonsSet.size) {
            // Remove contact persons from Redux state
            const contactPersonsToRemove: IContactPersonObject[] = contactPersonsReduxState?.filter(
                (cp: IContactPersonObject) => !contactPersonsSet.has(cp.id)
            );
            contactPersonsToRemove.forEach((contactPerson: IContactPersonObject): void => {
                dispatch(contactPersonActions.removeContactPersonRedux(contactPerson.id));
            });
        } else if (contactPersonsSet.size === reduxContactPersonsSet.size) {
            // Update contact persons in Redux state
            const contactPersonsToUpdate: IContactPersonObject[] = contactPersons.filter((cp: IContactPersonObject) =>
                reduxContactPersonsSet.has(cp.id)
            );
            dispatch(contactPersonActions.updateContactPersonRedux(contactPersonsToUpdate));
        }
    };

    /**
     * Extracts a contactPerson string from a IContactPersonObject interface.
     * @param {IContactPersonObject} contPersonObj IContactPersonObject for extraction
     * @returns {string} Full contact person label as string
     */
    const getContactPersonLabel = (contPersonObj: IContactPersonObject): string => {
        try {
            const role: string | undefined = roleOptions.find(
                (option: SelectOption): boolean => option.value === contPersonObj?.role
            )?.label;

            const nameString: string =
                getNameLabel(contPersonObj.name) !== "" ? getNameLabel(contPersonObj.name) : "Kontaktperson";

            return nameString + (role ? ` (${role})` : "");
        } catch {
            return "Label nicht initialisiert";
        }
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"ContactPersonForm"} onFinish={onFinish} form={form}>
                <MultiWrapper<IContactPersonObject>
                    componentName={"contactPersons"}
                    addText={"Neue Kontaktperson hinzufügen"}
                    label={getContactPersonLabel}
                    SingleWrapper={ContactPersonWrapper}
                />
            </Form>
        </div>
    );
};
export default ContactPersonForm;
