import { IExtension, IReduxAction } from "../../@types/ReduxTypes";

/**
 * Creates a redux action for setting the patient extension
 * @param {IExtension[]} extensionInterfaces The extension interfaces to set
 * @param {string} basePath The base path of the extension in the pio
 * @returns {IReduxAction} A redux action
 */
const setPatientExtensionRedux = (extensionInterfaces: IExtension[], basePath: string): IReduxAction => {
    return {
        type: "SET_PATIENT_EXTENSION",
        payload: { data: extensionInterfaces, basePath: basePath },
    };
};

/**
 * Deletes all patient extensions.
 * @returns {IReduxAction} A redux action
 */
const clearPatientExtensionRedux = (): IReduxAction => {
    return {
        type: "CLEAR_PATIENT_EXTENSION",
    };
};

export default {
    setPatientExtensionRedux,
    clearPatientExtensionRedux,
};
