import { IResponse } from "@thaias/pio_editor_meta";

import { IExtension, IReduxAction } from "../../@types/ReduxTypes";
import PIOService from "../../services/PIOService";
import { convertToExtensionSubTree } from "../../services/SubTreeConverterService";

/**
 * Reducer for saving subTreeStates to Redux. After saving the SubTree successfully, the SubTree is also saved to the
 * backend.
 * @param {IExtension[]} state The current state
 * @param {IReduxAction} action The action to perform
 * @returns {IExtension[]} The new state
 */
export const patientExtensionReducer = (
    state: IExtension[] = [],
    action: IReduxAction = {} as IReduxAction
): IExtension[] => {
    switch (action.type) {
        case "SET_PATIENT_EXTENSION":
            PIOService.saveSubTrees([
                convertToExtensionSubTree(action.payload.data as IExtension[], action.payload.basePath),
            ]).then((result: IResponse) => {
                if (!result.success) console.error(result);
            });
            return action.payload.data as IExtension[];
        case "CLEAR_PATIENT_EXTENSION":
            return [] as IExtension[];
        default:
            return state;
    }
};
