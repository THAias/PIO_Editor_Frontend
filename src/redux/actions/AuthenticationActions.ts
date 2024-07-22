import { IReduxAction } from "../../@types/ReduxTypes";

/**
 * Creates a redux action for login
 * @param {string} firstName first name of the user
 * @param {string} lastName last name of the user
 * @returns {IReduxAction} A redux action
 */
const loginRedux = (firstName: string, lastName: string): IReduxAction => {
    if (!firstName || !lastName) {
        throw new Error("First name and last name must be provided.");
    }
    return {
        type: "LOGIN",
        payload: { firstName: firstName, lastName: lastName },
    };
};

/**
 * Creates a redux action for logout
 * @returns {IReduxAction} A redux action
 */
const logoutRedux = (): IReduxAction => {
    return {
        type: "LOGOUT",
    };
};

/**
 * Stores that user has accepted the disclaimer
 * @returns {IReduxAction} A redux action
 */
const disclaimerAccepted = (): IReduxAction => {
    return {
        type: "DISCLAIMER_ACCEPTED",
    };
};

export default {
    loginRedux,
    logoutRedux,
    disclaimerAccepted,
};
