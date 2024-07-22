import { IPractitionerObject } from "@thaias/pio_editor_meta";

import { IReduxAction } from "../../@types/ReduxTypes";

/**
 * Holds all practitioner specific redux actions
 * @param {IPractitionerObject} practitioner The practitioner to add
 * @returns {IReduxAction} A redux action
 */
const addPractitionerRedux = (practitioner: IPractitionerObject): IReduxAction => {
    return {
        type: "ADD_PRACTITIONER",
        payload: { practitioner: practitioner },
    };
};

/**
 * Action to remove a practitioner from the redux store
 * @param {string} id The id of the practitioner to remove
 * @returns {IReduxAction} A redux action
 */
const removePractitionerRedux = (id: string): IReduxAction => {
    return {
        type: "REMOVE_PRACTITIONER",
        payload: { id: id },
    };
};

/**
 * Action to update the practitioner in the redux store
 * @param {IPractitionerObject[]} practitioners Gets all the practitioners as list
 * @returns {IReduxAction} A redux action
 */
const updatePractitionerRedux = (practitioners: IPractitionerObject[]): IReduxAction => {
    return {
        type: "UPDATE_PRACTITIONER",
        payload: { practitioners: practitioners },
    };
};

/**
 * Action to initialize the practitioner in the redux store without saving subTrees to backend
 * @param {IPractitionerObject[]} practitioners All practitioner interfaces as list
 * @returns {IReduxAction} A redux action
 */
const initializePractitionerRedux = (practitioners: IPractitionerObject[]): IReduxAction => {
    return {
        type: "INITIALIZE_PRACTITIONER",
        payload: { practitioners: practitioners },
    };
};

/**
 * Deletes all practitioners from redux.
 * @returns {IReduxAction} A redux action
 */
const clearPractitionerRedux = (): IReduxAction => {
    return {
        type: "CLEAR_PRACTITIONER",
    };
};

export default {
    addPractitionerRedux,
    removePractitionerRedux,
    updatePractitionerRedux,
    initializePractitionerRedux,
    clearPractitionerRedux,
};
