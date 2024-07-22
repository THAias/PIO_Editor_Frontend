import { INavigationProps, IReduxAction } from "../../@types/ReduxTypes";

const initialNavigationState: INavigationProps = {
    screen: "0",
    openPio: false,
    openPioType: undefined,
    openSession: false,
    collapsedMenu: false,
    exportPio: false,
};

/**
 * Reducer for navigation
 * @param {INavigationProps} state The current state
 * @param {IReduxAction} action The action to perform
 * @returns {INavigationProps} The new state
 */
export const navigationReducer = (
    state: INavigationProps = initialNavigationState,
    action: IReduxAction = {} as IReduxAction
): INavigationProps => {
    switch (action.type) {
        case "LOGIN":
            return { ...state, screen: "1" };
        case "LOGOUT":
            return initialNavigationState;
        case "COLLAPSE_MENU":
            return { ...state, collapsedMenu: action.payload.collapsedMenu };
        case "EXPORT_PIO":
            return { ...state, exportPio: action.payload.exportPio };
        case "CHANGE_SCREEN":
            return { ...state, screen: action.payload.screen, exportPio: false };
        case "OPEN_PIO":
            return { ...state, openPio: true, screen: "2" };
        case "SET_OPEN_PIO_TYPE":
            return { ...state, openPioType: action.payload.pioType };
        case "CLOSE_PIO":
            return { ...state, openPio: false, screen: "1" };
        case "SET_PIO_STATE":
            return { ...state, openPio: action.payload.openPio };
        default:
            return state;
    }
};
