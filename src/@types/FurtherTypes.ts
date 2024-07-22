import { IResponse } from "@thaias/pio_editor_meta";
import { Dispatch, SetStateAction } from "react";

/** All resource types which can be marked as 'given to the patient'. */
type GivenDevicesEnum =
    | "KBV_PR_MIO_ULB_Device_Aid"
    | "KBV_PR_MIO_ULB_Medication"
    | "KBV_PR_MIO_ULB_Provenance_Source_of_Information"
    | "KBV_PR_MIO_ULB_Device"
    | "KBV_PR_MIO_ULB_Device_Other_Item";

/** Interface which represents the response of the validator service. */
interface IValidationResult {
    overallResult: string;
    numberOfErrors: number;
    numberOfWarnings: number;
    errors: string[];
    warnings: string[];
    filteredErrorsPioSmallRelated?: string[];
    filteredErrorsSpecificationRelated?: string[];
    filteredErrorsValidatorRelated?: string[];
    filteredWarningsPioSmallRelated?: string[];
    filteredWarningsSpecificationRelated?: string[];
    filteredWarningsValidatorRelated?: string[];
}

/** Props for the React component "ValidatorModal". */
interface IValidatorModalProps {
    modalOpen: boolean;
    setModalOpen: Dispatch<SetStateAction<boolean>>;
    validationXmlObject: IValidationObject | undefined;
    setValidationXmlObject: Dispatch<SetStateAction<IValidationObject | undefined>>;
    validationResult: IResponse | undefined;
    setValidationResult: Dispatch<SetStateAction<IResponse | undefined>>;
}

/** Object containing the xmlString for the validation and a unique uuid. */
interface IValidationObject {
    id: string;
    xmlString: string;
}

export { GivenDevicesEnum, IValidationResult, IValidatorModalProps, IValidationObject };
