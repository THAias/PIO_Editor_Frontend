import { IReduxAction } from "../../@types/ReduxTypes";
import toastHandler from "../../components/ToastHandler";
import PIOService from "../../services/PIOService";
import UUIDService from "../../services/UUIDService";
import { initializeReduxSubTrees } from "../initializeRedux";

/**
 * Creates a redux action for closing the PIO
 * @returns {IReduxAction} A redux action
 */
const closePioRedux = async (): Promise<IReduxAction> => {
    return PIOService.closePIO().then((): IReduxAction => {
        return {
            type: "CLOSE_PIO",
        };
    });
};

/**
 * Creates a redux action for opening the PIO and initializing the redux store
 * @returns {IReduxAction} A redux action
 */
const openPio = async (): Promise<IReduxAction> => {
    return UUIDService.getInitialUUIDs().then(async (): Promise<IReduxAction> => {
        await initializeReduxSubTrees();
        return { type: "OPEN_PIO" };
    });
};

/**
 * Creates a redux action for setting the PIO state
 * @param {boolean} state The state to set
 * @returns {IReduxAction} A redux action
 */
const setPioRedux = (state: boolean): IReduxAction => {
    return {
        type: "SET_PIO_STATE",
        payload: { openPio: state },
    };
};

/**
 * Creates a redux action for changing the screen
 * @param {string} screen The screen to change to
 * @returns {IReduxAction} A redux action
 */
const changeScreenRedux = async (screen: string): Promise<IReduxAction> => {
    toastHandler.dismissAll();
    const baseUrl: string = window.location.origin;
    window.history.replaceState(null, "", baseUrl);
    return UUIDService.getInitialUUIDs().then(async (): Promise<IReduxAction> => {
        await initializeReduxSubTrees();
        return {
            type: "CHANGE_SCREEN",
            payload: { screen: screen },
        };
    });
};

/**
 * Creates a redux action for collapsing the side menu
 * @param {boolean} collapsedMenu boolean to check if menu is collapsed
 * @returns {IReduxAction} A redux action
 */
const collapseMenuRedux = (collapsedMenu: boolean): IReduxAction => {
    return {
        type: "COLLAPSE_MENU",
        payload: { collapsedMenu: collapsedMenu },
    };
};

/**
 * Action for changing open pio type.
 * "new" = a new/empty pio is open in editor
 * "imported" = a xml file was imported and is now open in editor
 * @param {"new" | "imported" | undefined} pioType Pio type to be set in redux
 * @returns {IReduxAction} A redux action
 */
const setOpenPioType = (pioType: "new" | "imported" | undefined): IReduxAction => {
    return {
        type: "SET_OPEN_PIO_TYPE",
        payload: { pioType: pioType },
    };
};

const exportPioRedux = (exportPioState: string | undefined): IReduxAction => {
    return {
        type: "EXPORT_PIO",
        payload: { exportPio: exportPioState },
    };
};

/**
 * Creates a redux action for cleaning the redux store
 * @returns {IReduxAction} A redux action
 */
const cleanStates = (): IReduxAction => {
    return {
        type: "CLEAN_STATE",
    };
};

export default {
    closePioRedux,
    openPioAndInitRedux: openPio,
    setPioRedux,
    changeScreenRedux,
    cleanStates,
    collapseMenuRedux,
    exportPioRedux,
    setOpenPioType,
};
