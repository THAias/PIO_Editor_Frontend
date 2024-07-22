import { IReduxAction } from "../../@types/ReduxTypes";

/**
 * Sets a redux state. When the redux state is changed, a validation of the xml string is automatically triggered
 * @param {string} id Id (=uuid) for the current validation process
 * @returns {IReduxAction} A redux action
 */
const setValidationId = (id: string): IReduxAction => {
    return {
        type: "SET_VALIDATION_ID",
        payload: { id: id },
    };
};

export default { setValidationId };
