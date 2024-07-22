import { IOrganizationObject } from "@thaias/pio_editor_meta";

import { IMockedAddressBookItem, IReduxAction } from "../../@types/ReduxTypes";

/**
 * Adds a single item to the mocked address book.
 * @param {IOrganizationObject} item Item to be added to address book
 * @returns {IReduxAction} A redux action
 */
const addAddressBookItem = (item: IOrganizationObject): IReduxAction => {
    return {
        type: "ADD_ITEM",
        payload: item,
    };
};

/**
 * Adds multiple items to the mocked address book.
 * @param {IOrganizationObject} items Multiple items to be added to address book
 * @returns {IReduxAction} A redux action
 */
const addAddressBookItems = (items: IOrganizationObject[]): IReduxAction => {
    return {
        type: "ADD_ITEMS",
        payload: items,
    };
};

/**
 * Updates a single item in the mocked address book.
 * @param {string} uuid Id of the item which should be updated
 * @param {IOrganizationObject} data Data for updating
 * @returns {IReduxAction} A redux action
 */
const updateAddressBookItem = (uuid: string, data: IOrganizationObject): IReduxAction => {
    return {
        type: "UPDATE_ITEM",
        payload: { uuid: uuid, data: data } as IMockedAddressBookItem,
    };
};

/**
 * Updates multiple items in the mocked address book.
 * @param {IMockedAddressBookItem[]} data Multiple items to be updated in address book
 * @returns {IReduxAction} A redux action
 */
const updateAddressBookItems = (data: IMockedAddressBookItem[]): IReduxAction => {
    return {
        type: "UPDATE_ITEMS",
        payload: data,
    };
};

/**
 * Deletes a single item from the mocked address book.
 * @param {string} uuid Id of the item which should be deleted from address book
 * @returns {IReduxAction} A redux action
 */
const deleteAddressBookItem = (uuid: string): IReduxAction => {
    return {
        type: "DELETE_ITEM",
        payload: uuid,
    };
};

/**
 * Deletes all items from the mocked address book.
 * @returns {IReduxAction} A redux action
 */
const deleteAllAddressBookItems = (): IReduxAction => {
    return {
        type: "DELETE_ALL_ITEMS",
    };
};

export default {
    addAddressBookItem,
    addAddressBookItems,
    updateAddressBookItem,
    updateAddressBookItems,
    deleteAddressBookItem,
    deleteAllAddressBookItems,
};
