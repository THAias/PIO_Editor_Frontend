import { IContactPersonObject, IResponse, SubTree } from "@thaias/pio_editor_meta";

import { IReduxAction } from "../../@types/ReduxTypes";
import PIOService from "../../services/PIOService";
import { convertToContactPersonSubTrees } from "../../services/SubTreeConverterService";
import UUIDService from "../../services/UUIDService";

const contactPersonInitial: IContactPersonObject[] = [];

const handleError = (result: IResponse): void => {
    if (!result.success) console.error(result);
};

/**
 * Reducer for contactPerson
 * @param {IContactPersonObject[]} state The current state
 * @param {IReduxAction} action The action to perform
 * @returns {IContactPersonObject[]} The new state
 */
export const contactPersonReducer = (
    state: IContactPersonObject[] = contactPersonInitial,
    action: IReduxAction = {} as IReduxAction
): IContactPersonObject[] => {
    switch (action.type) {
        case "ADD_CONTACT_PERSON":
            if (action.payload.contactPerson) {
                PIOService.saveSubTrees(
                    convertToContactPersonSubTrees([action.payload.contactPerson] as IContactPersonObject[])
                ).then((result1: IResponse) => handleError(result1));
                UUIDService.setUUID(action.payload.contactPerson.id, "KBV_PR_MIO_ULB_RelatedPerson_Contact_Person");
            }
            return [action.payload.contactPerson, ...state];
        case "REMOVE_CONTACT_PERSON":
            PIOService.saveSubTrees([new SubTree(action.payload.id, undefined)]).then((result1: IResponse) =>
                handleError(result1)
            );
            UUIDService.deleteUUIDs([action.payload.id]);
            return state.filter(
                (contactPerson: IContactPersonObject): boolean => contactPerson.id !== action.payload.id
            );
        case "UPDATE_CONTACT_PERSON":
            if (action.payload.contactPersons) {
                PIOService.saveSubTrees(
                    convertToContactPersonSubTrees(action.payload.contactPersons as IContactPersonObject[])
                ).then((result1: IResponse) => handleError(result1));
            }
            return action.payload.contactPersons;
        case "INITIALIZE_CONTACT_PERSON":
            (action.payload.contactPersons as IContactPersonObject[]).forEach((item: IContactPersonObject) => {
                UUIDService.setUUID(item.id, "KBV_PR_MIO_ULB_RelatedPerson_Contact_Person");
            });
            return action.payload.contactPersons;
        case "CLEAR_CONTACT_PERSON":
            return [] as IContactPersonObject[];
        case "CLOSE_PIO":
        case "CLEAN_STATE":
        case "LOGOUT":
            return [] as IContactPersonObject[];
        default:
            return state;
    }
};
