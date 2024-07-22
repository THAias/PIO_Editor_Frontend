import { IFullNameObject } from "@thaias/pio_editor_meta";
import { Dayjs } from "dayjs";

import { IPatientStateObject, IReduxAction } from "../../@types/ReduxTypes";

/**
 * Action to add patient data to the redux store
 * @param {IPatientStateObject} patientData The patient data to add (name, age, gender)
 * @returns {IReduxAction} A redux action
 */
const setPatientDataRedux = (patientData: IPatientStateObject): IReduxAction => {
    return {
        type: "SET_PATIENT_DATA",
        payload: { patientData: patientData },
    };
};

/**
 * Action to add patient name to the redux store
 * @param {IFullNameObject} patientName The patient name to add
 * @returns {IReduxAction} A redux action
 */
const setPatientNameRedux = (patientName?: IFullNameObject): IReduxAction => {
    return {
        type: "SET_PATIENT_NAME",
        payload: { patientName: patientName },
    };
};

/**
 * Action to add patient birthdate to the redux store
 * @param {Dayjs} patientBirthDate The patient birthdate to add
 * @returns {IReduxAction} A redux action
 */
const setPatientBirthDateRedux = (patientBirthDate?: Dayjs): IReduxAction => {
    return {
        type: "SET_PATIENT_BIRTHDATE",
        payload: { patientBirthDate: patientBirthDate },
    };
};

/**
 * Action to add patient gender to the redux store
 * @param {string} patientGender the selected gender of the patient to add
 * @returns {IReduxAction} A redux action
 */
const setPatientGenderRedux = (patientGender?: string): IReduxAction => {
    return {
        type: "SET_PATIENT_GENDER",
        payload: { patientGender: patientGender },
    };
};

/**
 * Deletes all patientState data.
 * @returns {IReduxAction} A redux action
 */
const clearPatientState = (): IReduxAction => {
    return {
        type: "CLEAR_PATIENT_DATA",
    };
};

export default {
    setPatientDataRedux,
    setPatientNameRedux,
    setPatientBirthDateRedux,
    setPatientGenderRedux,
    clearPatientState,
};
