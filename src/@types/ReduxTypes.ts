import { IFullNameObject, IOrganizationObject, IUserData } from "@thaias/pio_editor_meta";
import { Dayjs } from "dayjs";
import { AnyAction } from "redux";

import { reduxStore } from "../redux/store";

/**
 * type for the root state of the redux store
 */
export type RootState = ReturnType<typeof reduxStore.getState>;
/**
 * type for the dispatch function of the redux store
 */
export type AppDispatch = typeof reduxStore.dispatch;

/**
 * interface for an action of the redux store
 */
export type IReduxAction = AnyAction;

/**
 * Interface for the authentication state of the redux store
 * @property {IUserData} userData user data
 * @property {boolean} isLoggedIn boolean to check if user is logged in
 * @property {boolean} autoLogin Enables auto-login
 * @property {boolean} disclaimerAccepted Stores whether disclaimer was accepted by user
 */
export interface IAuthenticationState {
    userData?: IUserData;
    isLoggedIn: boolean;
    autoLogin: boolean;
    disclaimerAccepted: boolean;
}

/**
 * Interface of the navigation props in the redux store
 * @property {string} screen name of the current screen
 * @property {boolean} openPio boolean to check if PIO is open
 * @property {"new" | "imported" | undefined} openPioType Whether an empty pio or imported pio was opened in editor
 * @property {boolean} openSession boolean to check if session is open
 */
export interface INavigationProps {
    screen: string;
    openPio: boolean;
    openPioType: "new" | "imported" | undefined;
    openSession: boolean;
    collapsedMenu: boolean;
    exportPio: string | undefined;
}

/**
 * Interface for the mocked database (= address book).
 * @property {string} uuid Unique uuid of the organization item / resource
 * @property {IOrganizationObject} data Data of the organization resource
 */
export interface IMockedAddressBookItem {
    uuid: string;
    data: IOrganizationObject;
}

/**
 * Interface for the patient state of the redux store
 * @property {IFullNameObject} patientName the patient name
 * @property {Dayjs} patientBirthDate the patient birthdate
 * @property {string} patientGender the gender of the patient
 */
export interface IPatientStateObject {
    patientName?: IFullNameObject;
    patientBirthDate?: Dayjs;
    patientGender?: string;
}

/**
 * Interface representing one extension.
 * @property {string} url Extension url
 * @property {string} value Value of the extension as string
 * @property {string} dataType Type of the primitive data stored in the extension (e.g. "Boolean", "String", "Code")
 */
export interface IExtension {
    url: string;
    value: string;
    dataType: string;
}
