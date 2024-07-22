import { IOrganizationObject, IResponse } from "@thaias/pio_editor_meta";
import axios, { AxiosResponse } from "axios";

import { IMockedAddressBookItem } from "../@types/ReduxTypes";
import mockedDataBaseActions from "../redux/actions/MockedDataBaseActions";
import { reduxStore } from "../redux/store";
import { handleExpiredToken } from "./HelperService";
import { API_URL } from "./PIOService";

interface IAddressUpdateObject {
    uuid: string;
    data: IOrganizationObject;
}

//Counter for how often getAllAddressBookItems is called (relevant for 'webVersion')
let counterForGetAllItemsRoute: number = 0;

/**
 * Adds a new item to the address book. In 'webVersion' mode the route is mocked by a local redux database to avoid
 * cross effects among different users.
 * @param {IOrganizationObject} data Address book item for adding
 * @returns {IResponse} A response object
 */
const addAddressBookItem = async (data: IOrganizationObject): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            if (process.env.REACT_APP_VERSION_ENV === "webVersion") {
                reduxStore.dispatch(mockedDataBaseActions.addAddressBookItem(data));
                return {
                    success: true,
                    message: "Organization successfully added to address book",
                } as IResponse;
            } else {
                return axios.post(`${API_URL}addAddressBookItem`, { data: data }).then((response: AxiosResponse) => {
                    return response.data as IResponse;
                });
            }
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Adds multiple items to the address book. In 'webVersion' mode the route is mocked by a local redux database to avoid
 * cross effects among different users.
 * @param {IOrganizationObject[]} data Address book items for adding
 * @returns {IResponse} A response object
 */
const addAddressBookItems = async (data: IOrganizationObject[]): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            if (process.env.REACT_APP_VERSION_ENV === "webVersion") {
                reduxStore.dispatch(mockedDataBaseActions.addAddressBookItems(data));
                return {
                    success: true,
                    message: "Multiple organizations successfully added to address book",
                } as IResponse;
            } else {
                return axios.post(`${API_URL}addAddressBookItems`, { data: data }).then((response: AxiosResponse) => {
                    return response.data as IResponse;
                });
            }
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Updates an existing item in the address book. In 'webVersion' mode the route is mocked by a local redux database to
 * avoid cross effects among different users.
 * @param {string} uuid Unique uuid to specify the address book item which should be updated
 * @param {IOrganizationObject} data Address book item for updating
 * @returns {IResponse} A response object
 */
const updateAddressBookItem = async (uuid: string, data: IOrganizationObject): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            if (process.env.REACT_APP_VERSION_ENV === "webVersion") {
                reduxStore.dispatch(mockedDataBaseActions.updateAddressBookItem(uuid, data));
                return {
                    success: true,
                    message: "Address book item successfully updated",
                } as IResponse;
            } else {
                return axios
                    .post(`${API_URL}updateAddressBookItem`, { uuid: uuid, data: data })
                    .then((response: AxiosResponse) => {
                        return response.data as IResponse;
                    });
            }
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Updates an existing item in the address book.  In 'webVersion' mode the route is mocked by a local redux database to
 * avoid cross effects among different users.
 * @param {IAddressUpdateObject[]} data Address book items for updating
 * @returns {IResponse} A response object
 */
const updateAddressBookItems = async (data: IAddressUpdateObject[]): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            if (process.env.REACT_APP_VERSION_ENV === "webVersion") {
                reduxStore.dispatch(mockedDataBaseActions.updateAddressBookItems(data as IMockedAddressBookItem[]));
                return {
                    success: true,
                    message: "Multiple address book items successfully updated",
                } as IResponse;
            } else {
                return axios
                    .post(`${API_URL}updateAddressBookItems`, { data: data })
                    .then((response: AxiosResponse) => {
                        return response.data as IResponse;
                    });
            }
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Deletes an existing item from the address book. In 'webVersion' mode the route is mocked by a local redux database to
 * avoid cross effects among different users.
 * @param {string} uuid Unique uuid to specify the address book item which should be deleted
 * @returns {IResponse} A response object
 */
const deleteAddressBookItem = async (uuid: string): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            if (process.env.REACT_APP_VERSION_ENV === "webVersion") {
                reduxStore.dispatch(mockedDataBaseActions.deleteAddressBookItem(uuid));
                return {
                    success: true,
                    message: "Address book item successfully deleted",
                } as IResponse;
            } else {
                return axios.post(`${API_URL}deleteAddressBookItem`, { uuid: uuid }).then((response: AxiosResponse) => {
                    return response.data as IResponse;
                });
            }
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Deletes all existing items of one type from the address book. In 'webVersion' mode the route is mocked by a local
 * redux database to avoid cross effects among different users.
 * @returns {IResponse} A response object
 */
const deleteAllAddressBookItem = async (): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            if (process.env.REACT_APP_VERSION_ENV === "webVersion") {
                reduxStore.dispatch(mockedDataBaseActions.deleteAllAddressBookItems());
                return {
                    success: true,
                    message: "All address book items successfully deleted",
                } as IResponse;
            } else {
                return axios.post(`${API_URL}deleteAllAddressBookItem`, {}).then((response: AxiosResponse) => {
                    return response.data as IResponse;
                });
            }
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Requests all address book items. In 'webVersion' mode the route is mocked by a local redux database to avoid cross
 * effects among different users. The first call of the route will request example data from backend.
 * @returns {IResponse} A response object including data about all address book items of one specific type
 */
const getAllAddressBookItems = async (): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            if (process.env.REACT_APP_VERSION_ENV === "webVersion" && counterForGetAllItemsRoute > 0) {
                return {
                    success: true,
                    message: "All address book items successfully requested",
                    data: {
                        items: (reduxStore.getState().mockedDataBase as IMockedAddressBookItem[]).map(
                            (item: IMockedAddressBookItem): IOrganizationObject => {
                                return item.data;
                            }
                        ),
                    },
                } as IResponse;
            } else {
                if (process.env.REACT_APP_VERSION_ENV === "webVersion") counterForGetAllItemsRoute++;
                return axios.get(`${API_URL}getAllAddressBookItems`, {}).then((response: AxiosResponse) => {
                    return response.data as IResponse;
                });
            }
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Checks the availability of uuids in address book. In 'webVersion' mode the route is mocked by a local redux database
 * to avoid cross effects among different users.
 * @param {string} uuid Uuid for checking
 * @returns {IResponse} A response object including a true/false flag
 */
const doesUuidExistInAddressBook = async (uuid: string): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            if (process.env.REACT_APP_VERSION_ENV === "webVersion") {
                const index: number = (reduxStore.getState().mockedDataBase as IMockedAddressBookItem[]).findIndex(
                    (item: IMockedAddressBookItem) => item.uuid === uuid
                );
                return {
                    success: true,
                    message: "Organization successfully added to address book",
                    data: { doesExist: index !== -1 },
                } as IResponse;
            } else {
                return axios
                    .get(`${API_URL}doesUuidExistInAddressBook`, {
                        params: { uuid: uuid },
                    })
                    .then((response: AxiosResponse) => {
                        return response.data as IResponse;
                    });
            }
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

export default {
    addAddressBookItem,
    addAddressBookItems,
    updateAddressBookItem,
    updateAddressBookItems,
    deleteAddressBookItem,
    deleteAllAddressBookItem,
    getAllAddressBookItems,
    doesUuidExistInAddressBook,
};
