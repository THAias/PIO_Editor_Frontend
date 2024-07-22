import { IReduxAction } from "../../@types/ReduxTypes";

/**
 * Reducer for setting validation id
 * @param {string | undefined} state The current state
 * @param {IReduxAction} action The action to perform
 * @returns {string | undefined} The new state
 */
export const validatorReducer = (state: string = "", action: IReduxAction = {} as IReduxAction): string | undefined => {
    switch (action.type) {
        case "SET_VALIDATION_ID":
            return action.payload.id;
        case "LOGOUT":
            return "";
        default:
            return state;
    }
};
