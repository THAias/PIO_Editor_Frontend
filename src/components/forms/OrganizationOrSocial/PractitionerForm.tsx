import { IPractitionerObject } from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { AppDispatch, RootState } from "../../../@types/ReduxTypes";
import practitionerActions from "../../../redux/actions/PractitionerActions";
import { getNameLabel } from "../../../services/HelperService";
import ValueSets from "../../../services/ValueSetService";
import MultiWrapper from "../../wrappers/MultiWrapper";
import PractitionerWrapper from "../../wrappers/PractitionerWrapper";

/**
 * This form contains information about ONE practitioner (=professional people involved in medical care of the patient).
 * Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_Practitioner
 * - KBV_PR_MIO_ULB_PractitionerRole
 *
 * PIO-Small:
 * - Every Practitioner resource must have a PractitionerRole resource, which is referenced in Practitioner resource
 * - Cardinality of KBV_PR_MIO_ULB_Practitioner.qualification reduced to 0..1
 * - Cardinality of KBV_PR_MIO_ULB_PractitionerRole.code reduced to 0..1
 * - Cardinality of KBV_PR_MIO_ULB_PractitionerRole.speciality reduced to 0..1
 * - KBV_PR_MIO_ULB_PractitionerRole.code.text not supported
 * - KBV_PR_MIO_ULB_PractitionerRole.speciality.text not supported
 * - Cardinality of KBV_PR_MIO_ULB_Practitioner.identifier:ANR reduced to 0..1
 * - Cardinality of KBV_PR_MIO_ULB_Practitioner.identifier:ZANR reduced to 0..1
 * - KBV_PR_MIO_ULB_Practitioner.identifier:Telematik-ID not supported
 * - KBV_PR_MIO_ULB_Practitioner.gender not supported
 * - KBV_PR_MIO_ULB_Practitioner.birthDate not supported
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const PractitionerForm = (props: IFormProps): React.JSX.Element => {
    const roleValueSet: ValueSets = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Rolecare");
    const roleOptions: SelectOptions = roleValueSet.getOptionsSync;

    const dispatch: AppDispatch = useDispatch();
    const practitionerReduxState: IPractitionerObject[] = useSelector((state: RootState) => state.practitionerState);

    const form = props.form;
    /** Initialize Redux. */
    useEffect((): void => {
        if (practitionerReduxState) form.setFieldsValue({ practitioner: [...practitionerReduxState] });
    }, [practitionerReduxState]);

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        const practitioners: IPractitionerObject[] = value.practitioner as IPractitionerObject[];
        // Create sets for faster lookups
        const practitionerSet: Set<string> = new Set(
            practitioners
                .filter((pr: IPractitionerObject): boolean => pr.id !== undefined)
                .map((pr: IPractitionerObject) => pr.id)
        );
        const reduxPractitionerSet: Set<string> = new Set(
            practitionerReduxState
                ?.filter((pr: IPractitionerObject): boolean => pr.id !== undefined)
                .map((pr: IPractitionerObject) => pr.id)
        );

        if (practitionerSet.size > reduxPractitionerSet.size) {
            // Add new contact persons to Redux state
            const practitionersToAdd: IPractitionerObject[] = practitioners.filter(
                (pr: IPractitionerObject) => !reduxPractitionerSet.has(pr.id)
            );
            practitionersToAdd.forEach((practitioner: IPractitionerObject): void => {
                dispatch(practitionerActions.addPractitionerRedux(practitioner));
            });
        } else if (practitionerSet.size < reduxPractitionerSet.size) {
            // Remove contact persons from Redux state
            const practitionersToRemove: IPractitionerObject[] = practitionerReduxState?.filter(
                (pr: IPractitionerObject) => !practitionerSet.has(pr.id)
            );
            practitionersToRemove.forEach((practitioner: IPractitionerObject): void => {
                dispatch(practitionerActions.removePractitionerRedux(practitioner.id));
            });
        } else {
            // Update contact persons in Redux state
            const practitionerToUpdate: IPractitionerObject[] = practitioners.filter((pr: IPractitionerObject) =>
                reduxPractitionerSet.has(pr.id)
            );
            dispatch(practitionerActions.updatePractitionerRedux(practitionerToUpdate));
        }
    };

    const getPractitionerLabel = (practitionerObj: IPractitionerObject): string => {
        const role: string | undefined = roleOptions.find(
            (option: SelectOption): boolean => option.value === practitionerObj?.role
        )?.label;
        const nameString: string =
            getNameLabel(practitionerObj?.practitionerName) !== ""
                ? getNameLabel(practitionerObj?.practitionerName)
                : "Behandelnde Person";

        return nameString + (role ? ` (${role})` : "");
    };

    return (
        <div onBlur={form.submit}>
            <Form layout={"vertical"} name={"PractitionrForm"} onFinish={onFinish} form={form}>
                <MultiWrapper<IPractitionerObject>
                    componentName={"practitioner"}
                    addText={"Neue behandelnde Person hinzufügen"}
                    label={getPractitionerLabel}
                    SingleWrapper={PractitionerWrapper}
                    deleteToolTipText={"Diese Person ist als Author des PIOs gelistet und kann nicht gelöscht werden!"}
                />
            </Form>
        </div>
    );
};

export default PractitionerForm;
