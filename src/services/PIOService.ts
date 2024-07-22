import { IResponse, SubTree, addInformationAboutPrimitiveDataTypes, transformToSubTree } from "@thaias/pio_editor_meta";
import axios, { AxiosResponse } from "axios";

import { GivenDevicesEnum } from "../@types/FurtherTypes";
import { handleExpiredToken } from "./HelperService";
import UUIDService from "./UUIDService";

export const API_URL: string = process.env.NODE_ENV === "development" ? "http://localhost:7654/" : "/api/";

/**
 * Opens a PIO in backend, based on passed xmlString.
 * @param {string} xmlString Representing the PIO as string, which should be opened in backend
 * @returns {IResponse} Response from the backend
 */
const openPIO = async (xmlString: string): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.post(`${API_URL}openPIO`, { xmlString: xmlString }).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Function to check if a pio is already open
 * @returns {IResponse} Response from the backend
 */
const isPIOOpen = async (): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.get(`${API_URL}isPIOOpen`).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Function to check if a session is already open
 * @returns {IResponse} Response from the backend
 */
const isSessionOpen = async (): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.get(`${API_URL}isSessionOpen`).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Closes a PIO in backend.
 * @returns {IResponse} Response from the backend
 */
const closePIO = async (): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.post(`${API_URL}closePIO`, {}).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Opens a new / empty PIO in backend.
 * @returns {IResponse} Response from the backend
 */
const newPIO = async (): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.post(`${API_URL}newPIO`, {}).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Saves one or multiple SubTrees to the RootObject in backend. Every time, when a subTree is saved, the session time
 * gets reset. The session closes after a fixed time interval of inactivity.
 * @param {SubTree[]} subTrees Array of SubTrees for saving
 * @returns {IResponse} Response from the backend
 */
const saveSubTrees = async (subTrees: SubTree[]): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios
                .post(`${API_URL}saveSubTree`, { subTrees: addInformationAboutPrimitiveDataTypes(subTrees) })
                .then((response: AxiosResponse) => {
                    return response.data as IResponse;
                });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Delete one or multiple SubTrees from the RootObject in backend.
 * @param {SubTree[]} subTrees Array of SubTrees for deleting
 * @returns {IResponse} Response from the backend
 */
const deleteSubTrees = async (subTrees: SubTree[]): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios
                .post(`${API_URL}deleteSubTree`, {
                    subTrees: addInformationAboutPrimitiveDataTypes(subTrees),
                })
                .then((response: AxiosResponse) => {
                    const uuidStatus: boolean = UUIDService.deleteUUIDs(
                        subTrees.map((subTree: SubTree) => subTree.absolutePath.split(".")[0])
                    );
                    if (uuidStatus) console.debug("UUIDs deleted");
                    else console.error("UUIDs could not be deleted");
                    return response.data as IResponse;
                });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Requests one or multiple SubTrees from the RootObject in backend.
 * @param {string[]} paths Array of paths for the SubTree generation
 * @returns {IResponse} A response from the backend including the requested SubTrees
 */
const getSubTrees = async (paths: string[]): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios
                .get(`${API_URL}getSubTree`, {
                    params: { paths: paths },
                })
                .then((response: AxiosResponse): IResponse => {
                    if ((response.data as IResponse).success && (response.data as IResponse).data) {
                        const subTreeData: object[] = (response.data as IResponse).data?.subTrees as object[];
                        const transformedSubTrees: SubTree[] = subTreeData.map((item: object) =>
                            transformToSubTree(item)
                        );
                        return {
                            success: (response.data as IResponse).success,
                            message: (response.data as IResponse).message,
                            data: {
                                subTrees: transformedSubTrees,
                            },
                        } as IResponse;
                    } else {
                        //error message
                        return response.data as IResponse;
                    }
                });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Requests a xml string from backend representing the PIO.
 * @returns {IResponse} A response from the backend including the xml-string (=pio)
 */
const exportPIO = async (): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.get(`${API_URL}exportPIO`).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Adds an author to the PIO, which is currently opened in backend.
 * @param {string} uuid A uuid string, referring to the author resource
 * @returns {IResponse} Response from the backend
 */
const addAuthor = async (uuid: string): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.post(`${API_URL}addAuthor`, { author: uuid }).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Deletes an author by uuid from the PIO, which is currently opened in backend.
 * @param {string} uuid A uuid string, referring to the author resource
 * @returns {IResponse} Response from the backend
 */
const deleteAuthor = async (uuid: string): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.post(`${API_URL}deleteAuthor`, { author: uuid }).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Returning all author uuids from the PIO, which is currently opened in backend.
 * @returns {IResponse} Response from the backend containing all uuids
 */
const getAllAuthorUuids = async (): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.get(`${API_URL}getAllAuthorUuids`).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Sets the receiving institution in PIO header data.
 * @param {string} uuid A uuid string, referring to the receiving institution
 * @returns {IResponse} Response from the backend
 */
const setReceivingInstitution = async (uuid: string): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios
                .post(`${API_URL}setReceivingInstitution`, { institution: uuid })
                .then((response: AxiosResponse) => {
                    return response.data as IResponse;
                });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Clears the receiving institution in PIO header data.
 * @returns {IResponse} Response from the backend
 */
const clearReceivingInstitution = async (): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.post(`${API_URL}clearReceivingInstitution`).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Returns the uuid of the receiving institution from the PIO header data, which is currently opened in backend.
 * @returns {IResponse} Response from the backend containing the uuid. If no receiving institution is set, the 'success'
 * flag in the response will be 'false'
 */
const getReceivingInstitution = async (): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.get(`${API_URL}getReceivingInstitution`).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Adds the uuid of a given device of a specific resource type to composition data.
 * @param {string} uuid UUid to be added
 * @param {GivenDevicesEnum} resourceType Type of resource which should be added (e.g. KBV_PR_MIO_ULB_Device_Aid)
 * @returns {IResponse} Response from the backend
 */
const addGivenDevice = async (uuid: string, resourceType: GivenDevicesEnum): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios
                .post(`${API_URL}addGivenDevice`, { uuid: uuid, type: resourceType })
                .then((response: AxiosResponse) => {
                    return response.data as IResponse;
                });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Deletes the uuid of a given device of a specific resource type from composition data.
 * @param {string} uuid UUid to be deleted
 * @param {GivenDevicesEnum} resourceType Type of resource which should be deleted (e.g. KBV_PR_MIO_ULB_Device_Aid)
 * @returns {IResponse} Response from the backend
 */
const deleteGivenDevice = async (uuid: string, resourceType: GivenDevicesEnum): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios
                .post(`${API_URL}deleteGivenDevice`, { uuid: uuid, type: resourceType })
                .then((response: AxiosResponse) => {
                    return response.data as IResponse;
                });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Requests uuids of all given devices of one specific resource type.
 * @param {GivenDevicesEnum} resourceType Type of resource which should be requested (e.g. KBV_PR_MIO_ULB_Device_Aid)
 * @returns {IResponse} Response from the backend
 */
const getGivenDevices = async (resourceType: GivenDevicesEnum): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.post(`${API_URL}getGivenDevices`, { type: resourceType }).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Requests all uuids of all given devices.
 * @returns {IResponse} Response from the backend
 */
const getAllGivenDevices = async (): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.get(`${API_URL}getAllGivenDevices`).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Requests all uuids and their FHIR resource types from RootObject in backend.
 * @returns {IResponse} Response from the backend
 */
const getAllUuids = async (): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.get(`${API_URL}getAllUuids`).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Requests all readXmlErrors occurred during importing xml file.
 * @returns {IResponse} Response from the backend
 */
const getReadXmlErrors = async (): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.get(`${API_URL}getReadXmlErrors`).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Requests all pioSmallExclusions occurred during importing a xml file.
 * @returns {IResponse} Response from the backend
 */
const getPioSmallExclusions = async (): Promise<IResponse> => {
    //Check whether token is expired
    return axios.post(`${API_URL}checkSession`, { token: localStorage.getItem("token") }).then((res: AxiosResponse) => {
        if ((res.data as IResponse).success) {
            //Further request, if token is valid
            return axios.get(`${API_URL}getPioSmallExclusions`).then((response: AxiosResponse) => {
                return response.data as IResponse;
            });
        } else {
            handleExpiredToken();
            return res.data as IResponse;
        }
    });
};

/**
 * Requests the version number from backend.
 * @returns {IResponse} Response from the backend
 */
const getVersion = async (): Promise<IResponse> => {
    return axios.get(`${API_URL}getVersion`).then((response: AxiosResponse) => {
        return response.data as IResponse;
    });
};

/**
 * Requests the PIOEditorLimitationen.pdf from backend.
 * @returns {IResponse} Response from the backend
 */
const getLimitationsPDF = async (): Promise<IResponse> => {
    return axios.get(`${API_URL}getLimitationsPDF`).then((response: AxiosResponse) => {
        return response.data as IResponse;
    });
};

/**
 * Request if DB connection is established
 * @returns {IResponse} Response from the backend
 */
const checkConnectionDB = async (): Promise<IResponse> => {
    return axios.get(`${API_URL}checkConnectionDB`).then((response: AxiosResponse) => {
        return response.data as IResponse;
    });
};

export default {
    openPIO,
    newPIO,
    saveSubTrees,
    deleteSubTrees,
    getSubTrees,
    exportPIO,
    closePIO,
    addAuthor,
    getAllUuids,
    isPIOOpen,
    isSessionOpen,
    deleteAuthor,
    getAllAuthorUuids,
    setReceivingInstitution,
    clearReceivingInstitution,
    getReceivingInstitution,
    addGivenDevice,
    deleteGivenDevice,
    getGivenDevices,
    getAllGivenDevices,
    getReadXmlErrors,
    getPioSmallExclusions,
    getVersion,
    getLimitationsPDF,
    checkConnectionDB,
};
