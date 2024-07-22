import { IAuthenticationState, IReduxAction } from "../../@types/ReduxTypes";

const authenticationInitial: IAuthenticationState = {
    userData: undefined,
    isLoggedIn: false,
    autoLogin: true,
    disclaimerAccepted: false,
};

/**
 * Reducer for logging in and out with username and password. -> Save user data to Redux.
 * @param {IAuthenticationState} state The current state
 * @param {IReduxAction} action The action to perform
 * @returns {IAuthenticationState} The new state
 */
export const authenticationReducer = (
    state: IAuthenticationState = authenticationInitial,
    action: IReduxAction = {} as IReduxAction
): IAuthenticationState => {
    switch (action.type) {
        case "LOGIN":
            return {
                userData: {
                    firstName: action.payload.firstName,
                    lastName: action.payload.lastName,
                },
                isLoggedIn: true,
                autoLogin: true,
                disclaimerAccepted: state.disclaimerAccepted,
            };
        case "LOGOUT":
            return { ...authenticationInitial, autoLogin: false, disclaimerAccepted: false };
        case "DISCLAIMER_ACCEPTED":
            return {
                userData: state.userData,
                isLoggedIn: state.isLoggedIn,
                autoLogin: state.autoLogin,
                disclaimerAccepted: true,
            };
        default:
            return state;
    }
};
