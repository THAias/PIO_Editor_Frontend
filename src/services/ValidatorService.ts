import { IResponse } from "@thaias/pio_editor_meta";
import axios, { AxiosResponse } from "axios";

import { VALIDATOR_SERVICE } from "./GlobalVariables";
import { handleExpiredToken } from "./HelperService";
import { API_URL } from "./PIOService";

/**
 * Sends xml string to backend for validation.
 * @param {string} xmlString Representing the PIO as string, which should be validated in backend
 * @returns {IResponse} Response from backend
 */
const validatePIO = async (xmlString: string): Promise<IResponse> => {
    //Check whether token is expired
    return axios
        .post(`${API_URL}checkSession`, { token: localStorage.getItem("token") })
        .then(async (res: AxiosResponse) => {
            if ((res.data as IResponse).success) {
                //Further request, if token is valid
                if (VALIDATOR_SERVICE) {
                    try {
                        return await axios
                            .post(`${API_URL}validatePIO`, { xmlString: xmlString })
                            .then((response: AxiosResponse) => {
                                return response.data as unknown as IResponse;
                            });
                    } catch (error) {
                        let errorMessage: string = "Unknown error";
                        if (error instanceof Error) errorMessage = error.message;
                        return {
                            success: false,
                            message: "Validation failed due to following error: " + errorMessage,
                        } as IResponse;
                    }
                } else {
                    return {
                        success: false,
                        message: "Validator service is disabled",
                    } as IResponse;
                }
            } else {
                handleExpiredToken();
                return res.data as IResponse;
            }
        });
};

export default { validatePIO };
