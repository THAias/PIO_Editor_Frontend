import { IOrganizationObject } from "@thaias/pio_editor_meta";

import { IReduxAction } from "../../@types/ReduxTypes";

/**
 * Add an organization to the redux store
 * @param {IOrganizationObject} organization The organization to add
 * @returns {IReduxAction} A redux action
 */
const addOrganizationRedux = (organization: IOrganizationObject): IReduxAction => {
    return {
        type: "ADD_ORGANIZATION",
        payload: { organization: organization },
    };
};

/**
 * Add an organization to the redux store
 * @param {IOrganizationObject} organization The organization to add
 * @returns {IReduxAction} A redux action
 */
const addOrganizationsRedux = (organization: IOrganizationObject[]): IReduxAction => {
    return {
        type: "ADD_ORGANIZATIONS",
        payload: { organization: organization },
    };
};

/**
 * Action to remove an organization from the redux store
 * @param {string} id The id of the organization to remove
 * @returns {IReduxAction} A redux action
 */
const removeOrganizationRedux = (id: string): IReduxAction => {
    return {
        type: "REMOVE_ORGANIZATION",
        payload: { id: id },
    };
};

/**
 * Action to update the organization in the redux store
 * @param {IOrganizationObject} organization Gets the organization as object
 * @returns {IReduxAction} A redux action
 */
const updateOrganizationRedux = (organization: IOrganizationObject): IReduxAction => {
    return {
        type: "UPDATE_ORGANIZATION",
        payload: { organization: organization },
    };
};

/**
 * Action to update the organization in the redux store
 * @param {IOrganizationObject} organization Gets the organization as object
 * @returns {IReduxAction} A redux action
 */
const updateOrganizationsRedux = (organization: IOrganizationObject[]): IReduxAction => {
    return {
        type: "UPDATE_ORGANIZATIONS",
        payload: { organization: organization },
    };
};

/**
 * Action to clear all organizations.
 * @returns {IReduxAction} A redux action
 */
const clearOrganizationsRedux = (): IReduxAction => {
    return {
        type: "CLEAR_ORGANIZATIONS",
    };
};

export default {
    addOrganizationRedux,
    addOrganizationsRedux,
    removeOrganizationRedux,
    updateOrganizationRedux,
    updateOrganizationsRedux,
    clearOrganizationsRedux,
};
