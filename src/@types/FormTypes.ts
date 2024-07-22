import {
    IAddressObject,
    IAllergyObject,
    IFullNameObject,
    IOrganizationIdentifierObject,
    IOrganizationObject,
    IRiskObject,
    ITimePeriodObject,
} from "@thaias/pio_editor_meta";
import { FormInstance } from "antd";
import { NamePath } from "antd/es/form/interface";
import { Dayjs } from "dayjs";
import React, { Dispatch, SetStateAction } from "react";

export interface IFormProps {
    form: FormInstance;
    sending?: boolean;
}

export interface INonFormProps {
    resource?: { [s: string]: unknown };
}

/**
 * Short Interface for optional address values used for the text field in the PIO structure
 * @property {IAddressLine} line Interface used for line field also part of the text field
 * @property {string} postalCode Numerical value for the address postal code
 * @property {string} city String value for the address city
 * @property {string} country String value for the address country (based on valueset for countries)
 */
export interface IAddressText {
    line: IAddressLine;
    postalCode?: string;
    city?: string;
    country?: string;
}

/**
 * Short Interface for optional address values used for the line field in the PIO structure
 * @property {string} street String value for the address street
 * @property {string} houseNumber String value for the address house number
 * @property {string} additionalLocator String value for the address additional locators (e.g. 1. Stock)
 * @property {string} postOfficeBoxNumber String value for the address post office box number (only given if address is postbox)
 */
export interface IAddressLine {
    street?: string;
    houseNumber?: string;
    additionalLocator?: string;
    postOfficeBoxNumber?: string;
}

/**
 * The interface for the Properties of a single Wrapper Component used in modals or MultiWrapper
 * @property {NamePath} name interface for name paths
 * @property {string} parentName string representing the single wrapper's parent name
 */
export interface ISingleWrapperProps {
    name?: NamePath;
    parentName?: string;
    fullPath?: string;
}

/**
 * The interface for the Properties of the TelecomWrapper component extending the ISingleWrapperProps
 * @property {boolean} addressBook boolean to specify if the telecom is part of the address book
 */
export interface ITelecomWrapperProps extends ISingleWrapperProps {
    addressBook?: boolean;
}

/**
 * The interface for the Properties of the OrganizationWrapper component extending the ISingleWrapperProps
 * @property {boolean} addressBook boolean to specify if the organization is part of the address book
 */
export interface IOrganizationWrapperProps extends ISingleWrapperProps {
    addressBook?: boolean;
}

/**
 * The interface for the Properties of the MultiWrapper component
 * @property {NamePath} componentName an array of strings or a string as name path
 * @property {React.FC} SingleWrapper the single wrapper component
 * @property {string} addText the text for the add button of the accordion
 * @property {string} label the label for the accordion if the panel is collapsed
 * @property {NamePath} nestedWrapperParentLabel? optional string for the nested wrapper's parent name (normally a string)
 */
export interface IMultiWrapperProps<T> {
    componentName: NamePath;
    SingleWrapper: React.FC<ISingleWrapperProps>;
    addText: string;
    label: (obj: T) => string;
    nestedWrapperParentLabel?: NamePath;
    fullPath?: boolean;
    deleteToolTipText?: string;
}

/**
 * Interface for the Family type object
 * @property {string} nachname? optional string that represents the family name
 * @property {string} vorsatzwort? optional string that represents the name's prefix
 * @property {string} namenszusatz? optional string that represents the name's addition
 */
export interface IFamilyType {
    nachname?: string;
    vorsatzwort?: string;
    namenszusatz?: string;
}

/**
 * Interface for the OfficialMaiden name object
 * @property {IFamilyType} family IFamilyType object that represents the family name
 * @property {string} prefix? optional string that represents the name's prefix
 * @property {string} given? optional string that represents the name's given name
 */
export interface IOfficialMaiden {
    family: IFamilyType;
    prefix?: string;
    given?: string;
}

/**
 * Interface for the high level Name object
 * @property {IOfficialMaiden} official IOfficialMaiden object that represents the official name
 * @property {IOfficialMaiden} maiden IOfficialMaiden object that represents the maiden name
 */
export interface INameObject {
    official: IOfficialMaiden;
    maiden: IOfficialMaiden;
}

/**
 * Interface for the NameForm props object
 * @property {NamePath} name? optional string for the name field
 * @property {boolean} maidenName? optional boolean to specify if the name is a maiden name
 * @property {NamePath} parentName? optional string for the parent name field
 * @property {(label: string, maidenOptions: boolean) => void} removeHandler? optional handler function passed from parent to handle removal
 */
export interface INameFormProps {
    name?: NamePath;
    maidenName?: boolean;
    parentName?: NamePath;
    removeHandler?: (label: string, maidenOptions: boolean) => void;
    isAuthor?: boolean;
}

/**
 * Interface for the NameOptions object
 * @property {string} label label text of the name field
 * @property {string} placeholder placeholder text of the name field
 * @property {string} helperText? optional helper text of the name field
 */
export interface INameOptions {
    label: string;
    placeholder: string;
    helperText?: string;
}

/**
 * Interface for the Form finish object of antd forms
 * @property {string} key key of the form finish object
 * @property {string | string[] | IAddressObject[] | IOrganizationObject | IOrganizationIdentifierObject | IFullNameObject | Dayjs} value value of the form finish object
 */
export interface IFormFinishObject {
    [key: string]:
        | string
        | string[]
        | IAddressObject[]
        | IOrganizationObject
        | IOrganizationIdentifierObject
        | IFullNameObject
        | Dayjs
        | ITimePeriodObject
        | IBloodPressureValue
        | IRiskObject[]
        | IAllergyObject[]
        | undefined;
}

/**
 * Interface for the blood pressure object property
 * @property {number} systolic number value for the systolic blood pressure
 * @property {number} diastolic number value for the diastolic blood pressure
 */
export interface IBloodPressureValue {
    systolic: number;
    diastolic: number;
}

export interface IDeviceAid {
    id: string;
    deviceAid: string;
    comment?: string;
}

export interface IDeviceAidAdditions {
    id: string;
    given: boolean;
    label: string;
    value: string;
}

/**
 * Interface for table data in the AddressBook component
 * @property {React.Key} key unique key for the table row
 * @property {string} id unique id for the table row
 * @property {string} name name of the table row
 * @property {string} type? optional type of the table row
 * @property {string} address? optional address of the table row
 * @property {string} telecom? optional telecom of the table row
 * @property {React.JSX.Element} expansion expansion panel of the table row
 */
export interface ITableDataType {
    key: React.Key;
    id: string;
    name: string;
    type?: string;
    address?: string;
    telecom?: string;
    expansion: React.JSX.Element;
}

/**
 * Interface for the Label Component
 * @property {string} title title of the label
 * @property {boolean} required boolean to specify if the label is required
 * @property {string} helperText optional helper text of the label
 * @property {boolean} hugeTopMargin optional boolean to specify if the label has a huge top margin
 */
export interface IFormLabelProps {
    title: string;
    required: boolean;
    helperText?: string;
    hugeTopMargin?: boolean;
    smallBottomMargin?: boolean;
}

/**
 * Interface for the ConsentStatement component
 * @property {string} id unique id of the consent statement
 * @property {string} policyRule policy rule of the consent statement
 * @property {string} comment? optional comment of the consent statement
 * @property {Dayjs} dateTime? optional date time of the consent statement
 * @property {string} proxy? optional ContactPerson id of the consent statement
 */
export interface IConsentStatement {
    id: string;
    policyRule: string;
    comment?: string;
    dateTime?: Dayjs;
    proxy?: string;
}

export interface ITabs {
    TabOrganizationOrSocial: ITab;
    TabCareInformation: ITab;
    TabAdditionalData?: ITab;
}

export interface ITab {
    tabTitle: string;
    components: { [key: string]: IComponents };
}

export interface IComponents {
    formsInstances?: FormInstance[][];
    componentProps: { [key: string]: unknown };
    components: React.FC<IFormProps>[] | React.FC<INonFormProps>[];
    title: string;
}

export interface IRenderTabs {
    TabOrganizationOrSocial: boolean;
    TabCareInformation: boolean;
}

/**
 * Interface for the NursingMeasures component
 * @property {string} id unique id of the nursing measure
 * @property {string} measure type of the nursing measure
 * @property {ITimePeriodObject} timePeriod? optional time period of the nursing measure
 * @property {Dayjs} timeInstance? optional time instance of the nursing measure
 * @property {string} frequency? optional frequency of the nursing measure
 * @property {string} durationValue? optional duration value of the nursing measure
 * @property {string} durationUnit? optional duration unit of the nursing measure
 * @property {string} period? optional period of the nursing measure
 * @property {string} periodUnit? optional period unit of the nursing measure
 * @property {string} performer? optional performer of the nursing measure
 * @property {string} comment? optional comment of the nursing measure
 */
export interface INursingMeasures {
    id: string;
    measure: string;
    timePeriod?: ITimePeriodObject;
    timeInstance?: string;
    frequency?: string;
    durationValue?: string;
    durationUnit?: string;
    period?: string;
    periodUnit?: string;
    performer?: string;
    comment?: string;
}

/**
 * Interface for TabCareInformation.tsx and TabOrganisationOrSocial.tsx
 * @property {boolean} collapsed boolEan which holds the status of the sideMenu
 */
export interface ITabContentProps {
    components: { [key: string]: IComponents };
    setRenderedTabs: Dispatch<SetStateAction<IRenderTabs>>;
    tabName: string;
}

export interface IAllFormInstances {
    patientInsuranceForm: [FormInstance];
    careLevelForm: [FormInstance];
    patientInfoForm: [FormInstance];
    patientCommunicationForm: [FormInstance];
    degreeOfDisabilityForm: [FormInstance];
    patientLocationForm: [FormInstance];
    contactPersonForm: [FormInstance];
    sendingOrganizationForm: [FormInstance];
    receivingOrganizationForm: [FormInstance];
    practitionerForm: [FormInstance];
    infoAboutRelativesForm: [FormInstance];
    legalCareForm: [FormInstance];
    devicesAidForm: [FormInstance];
    implantForm: [FormInstance];
    uploadDocumentsForm: [FormInstance];
    barthelForm: [FormInstance];
    riskForm: [FormInstance];
    allergyForm: [FormInstance];
    orientationForm: [FormInstance];
    strikingBehaviorForm: [FormInstance];
    deprivationOfLibertyForm: [FormInstance];
    isolationForm: [FormInstance];
    vitalBodyForm: [FormInstance];
    medicalProblemForm: [FormInstance];
    careProblemForm: [FormInstance];
    breathForm: [FormInstance];
    urinaryFecalForm: [FormInstance];
    foodTypeForm: [FormInstance];
    painForm: [FormInstance];
    nursingMeasuresForm: [FormInstance];
    medicinesInformationForm: [FormInstance];
    patientWishForm: [FormInstance];
    consentStatementForm: [FormInstance];
}
