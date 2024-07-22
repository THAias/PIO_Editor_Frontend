import { IResponse, IUserData } from "@thaias/pio_editor_meta";
import axios, { AxiosResponse } from "axios";

import authenticationActions from "../redux/actions/AuthenticationActions";
import contactPersonActions from "../redux/actions/ContactPersonActions";
import navigationActions from "../redux/actions/NavigationActions";
import organizationActions from "../redux/actions/OrganizationActions";
import patientExtensionActions from "../redux/actions/PatientExtensionActions";
import patientStateActions from "../redux/actions/PatientStateActions";
import practitionerActions from "../redux/actions/PractitionerActions";
import { reduxStore } from "../redux/store";
import { handleExpiredToken } from "./HelperService";
import { API_URL } from "./PIOService";

/**
 * This route is used for opening a new session without user login. Just the name of the user (first name & last name)
 * are stored as user information for the current session. Just one session at the same time can be opened.
 * @param {string} firstName The first name of the user to open the session for
 * @param {string} lastName The last name of the user to open the session for
 * @param {string} fingerPrint Unique uuid for the user
 * @returns {IResponse} The response from the backend
 */
export const openSession = async (firstName: string, lastName: string, fingerPrint: string): Promise<IResponse> => {
    const userData: IUserData = {
        firstName: firstName,
        lastName: lastName,
        fingerPrint: fingerPrint,
    };

    return axios.post(`${API_URL}openSession`, { userData: userData }).then((response: AxiosResponse) => {
        return response.data as IResponse;
    });
};

export const checkSession = async (token: string): Promise<IResponse> => {
    return axios.post(`${API_URL}checkSession`, { token: token }).then((response: AxiosResponse) => {
        return response.data as IResponse;
    });
};

/**
 * This route is used for closing a session, which was opened by the route openSession().
 * @returns {IResponse} The response from the backend
 */
export const closeSession = async (): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.post(`${API_URL}closeSession`, {}).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Will set the starting time of session to the current time. Session time gets renewed.
 * @returns {IResponse} The response from the backend
 */
export const renewSessionTime = async (): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.post(`${API_URL}renewSessionTime`, {}).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/** This function runs all necessary processes when a user logs out. */
export const runLogoutTasks = () => {
    //Clear redux data
    reduxStore.dispatch(authenticationActions.logoutRedux());
    reduxStore.dispatch(organizationActions.clearOrganizationsRedux());
    reduxStore.dispatch(patientExtensionActions.clearPatientExtensionRedux());
    reduxStore.dispatch(patientStateActions.clearPatientState());
    reduxStore.dispatch(contactPersonActions.clearContactPersonRedux());
    reduxStore.dispatch(practitionerActions.clearPractitionerRedux());
    reduxStore.dispatch(navigationActions.setOpenPioType(undefined));

    //Clear axios header for all further requests
    axios.defaults.headers.common.Authorization = undefined;
    localStorage.removeItem("token");
    localStorage.removeItem("fingerPrint");
};
