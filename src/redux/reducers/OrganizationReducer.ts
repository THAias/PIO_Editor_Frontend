import { IOrganizationObject } from "@thaias/pio_editor_meta";

import { IReduxAction } from "../../@types/ReduxTypes";
import UUIDService from "../../services/UUIDService";

/**
 * Reducer for organization
 * @param {IOrganizationObject[]} state The current state
 * @param {IReduxAction} action The action to perform
 * @returns {IOrganizationObject[]} The new state
 */
export const organizationReducer = (
    state: IOrganizationObject[] = [],
    action: IReduxAction = {} as IReduxAction
): IOrganizationObject[] => {
    switch (action.type) {
        case "ADD_ORGANIZATION":
            UUIDService.setUUID(action.payload.organization.id, "KBV_PR_MIO_ULB_Organization");
            return [...state, action.payload.organization];
        case "ADD_ORGANIZATIONS":
            action.payload.organization.forEach((item: IOrganizationObject): void => {
                UUIDService.setUUID(item.id, "KBV_PR_MIO_ULB_Organization");
            });
            return [...state, ...action.payload.organization];
        case "REMOVE_ORGANIZATION":
            UUIDService.deleteUUIDs([action.payload.id]);
            return state.filter((organization: IOrganizationObject): boolean => organization.id !== action.payload.id);
        case "UPDATE_ORGANIZATION":
            return state.map((organization: IOrganizationObject): IOrganizationObject => {
                if (organization.id === action.payload.organization.id) {
                    return action.payload.organization;
                }
                return organization;
            });
        case "UPDATE_ORGANIZATIONS":
            return state.map((organization: IOrganizationObject): IOrganizationObject => {
                const updatedOrganization: IOrganizationObject | undefined = action.payload.organization.find(
                    (item: IOrganizationObject): boolean => item.id === organization.id
                );
                if (updatedOrganization) {
                    return updatedOrganization;
                }
                return organization;
            });
        case "CLEAR_ORGANIZATIONS":
            return [] as IOrganizationObject[];
        default:
            return state;
    }
};
