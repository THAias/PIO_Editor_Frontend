import { IOrganizationObject } from "@thaias/pio_editor_meta";

import { IMockedAddressBookItem, IReduxAction } from "../../@types/ReduxTypes";

const addressBookInitial: IMockedAddressBookItem[] = [];

/**
 * Reducer for logging in and out with username and password. -> Save user data to Redux.
 * @param {IMockedAddressBookItem[]} state The current state
 * @param {IReduxAction} action The action to perform
 * @returns {IMockedAddressBookItem[]} The new state
 */
export const mockedDataBaseReducer = (
    state: IMockedAddressBookItem[] = addressBookInitial,
    action: IReduxAction = {} as IReduxAction
): IMockedAddressBookItem[] => {
    switch (action.type) {
        case "ADD_ITEM":
            const newUuid: string = action.payload.id;
            if (state.find((item: IMockedAddressBookItem) => item.uuid === newUuid)) {
                //Uuid already exists
                return state;
            } else {
                return [...state, { uuid: newUuid, data: action.payload }];
            }
        case "ADD_ITEMS":
            const itemsToAdd: IMockedAddressBookItem[] = (action.payload as IOrganizationObject[])
                .map((orga: IOrganizationObject): IMockedAddressBookItem | undefined => {
                    if (state.find((item: IMockedAddressBookItem) => item.uuid === orga.id)) return undefined;
                    else return { uuid: orga.id, data: orga };
                })
                .filter((orga: IMockedAddressBookItem | undefined) => orga !== undefined) as IMockedAddressBookItem[];
            return [...state, ...itemsToAdd];
        case "UPDATE_ITEM":
            if (state.find((item: IMockedAddressBookItem) => item.uuid === action.payload.uuid)) {
                return [
                    ...state.filter((item: IMockedAddressBookItem) => item.uuid === action.payload.uuid),
                    action.payload.data,
                ];
            } else {
                //No matching uuid found for updating
                return state;
            }
        case "UPDATE_ITEMS":
            const allExistingUuids: string[] = state.map((item: IMockedAddressBookItem): string => {
                return item.uuid;
            });
            const allItemsForUpdate: IMockedAddressBookItem[] = (action.payload as IMockedAddressBookItem[]).filter(
                (item: IMockedAddressBookItem) => allExistingUuids.includes(item.uuid)
            );
            const allUuidsForUpdate: string[] = allItemsForUpdate.map((item: IMockedAddressBookItem): string => {
                return item.uuid;
            });
            const oldStateWithDeletedItems: IMockedAddressBookItem[] = state.filter(
                (item: IMockedAddressBookItem) => !allUuidsForUpdate.includes(item.uuid)
            );
            return [...oldStateWithDeletedItems, ...allItemsForUpdate];
        case "DELETE_ITEM":
            return [...state.filter((item: IMockedAddressBookItem) => item.uuid !== action.payload)];
        case "DELETE_ALL_ITEMS":
            return [] as IMockedAddressBookItem[];
        default:
            return state;
    }
};
