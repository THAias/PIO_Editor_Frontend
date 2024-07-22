import { IPatientStateObject, IReduxAction } from "../../@types/ReduxTypes";

/**
 * Reducer for patientState
 * @param {IPatientStateObject} state The current state
 * @param {IReduxAction} action The action to perform
 * @returns {IPatientStateObject} The new state
 */
export const patientStateReducer = (
    state: IPatientStateObject = {},
    action: IReduxAction = {} as IReduxAction
): IPatientStateObject => {
    switch (action.type) {
        case "SET_PATIENT_DATA":
            return action.payload.patientData;
        case "SET_PATIENT_NAME":
            return { ...state, patientName: action.payload.patientName };
        case "SET_PATIENT_BIRTHDATE":
            return { ...state, patientBirthDate: action.payload.patientBirthDate };
        case "SET_PATIENT_GENDER":
            return { ...state, patientGender: action.payload.patientGender };
        case "CLEAR_PATIENT_DATA":
            return {} as IPatientStateObject;
        default:
            return state;
    }
};
