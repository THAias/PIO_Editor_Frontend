import { IContactPersonObject } from "@thaias/pio_editor_meta";

import { IReduxAction } from "../../@types/ReduxTypes";

/**
 * Action to add a contact person to the redux store
 * @param {IContactPersonObject} contactPerson The contact person to add
 * @returns {IReduxAction} A redux action
 */
const addContactPersonRedux = (contactPerson: IContactPersonObject): IReduxAction => {
    return {
        type: "ADD_CONTACT_PERSON",
        payload: { contactPerson: contactPerson },
    };
};

/**
 * Action to remove a contact person from the redux store
 * @param {string} id The id of the contact person to remove
 * @returns {IReduxAction} A redux action
 */
const removeContactPersonRedux = (id: string): IReduxAction => {
    return {
        type: "REMOVE_CONTACT_PERSON",
        payload: { id: id },
    };
};

/**
 * Action to update the contact persons in the redux store
 * @param {IContactPersonObject[]} contactPersons Gets all the contactPersons as list
 * @returns {IReduxAction} A redux action
 */
const updateContactPersonRedux = (contactPersons: IContactPersonObject[]): IReduxAction => {
    return {
        type: "UPDATE_CONTACT_PERSON",
        payload: { contactPersons: contactPersons },
    };
};

/**
 * Action to initialize the contact persons in the redux store without saving subTrees to backend
 * @param {IContactPersonObject[]} contactPersons Gets all contactPersons as list
 * @returns {IReduxAction} A redux action
 */
const initializeContactPersonRedux = (contactPersons: IContactPersonObject[]): IReduxAction => {
    return {
        type: "INITIALIZE_CONTACT_PERSON",
        payload: { contactPersons: contactPersons },
    };
};

/**
 * Deletes all contact persons from redux.
 * @returns {IReduxAction} A redux action
 */
const clearContactPersonRedux = (): IReduxAction => {
    return {
        type: "CLEAR_CONTACT_PERSON",
    };
};

/**
 * Holds all contactPerson specific redux actions
 */
export default {
    addContactPersonRedux,
    removeContactPersonRedux,
    updateContactPersonRedux,
    initializeContactPersonRedux,
    clearContactPersonRedux,
};
