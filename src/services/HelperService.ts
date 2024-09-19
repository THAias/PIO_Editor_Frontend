import {
    CodePIO,
    IAddressObject,
    IDeviceObject,
    IFullNameObject,
    IImplantObject,
    IOrganizationObject,
    IResponse,
    ITelecomObject,
    StringPIO,
    SubTree,
    UriPIO,
} from "@thaias/pio_editor_meta";
import { Coding, SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import dayjs, { Dayjs } from "dayjs";

import { ISingleWrapperProps } from "../@types/FormTypes";
import { IExtension } from "../@types/ReduxTypes";
import toastHandler from "../components/ToastHandler";
import { runLogoutTasks } from "./LoginService";
import PIOService from "./PIOService";
import ValueSets from "./ValueSetService";

/**
 * Writes a FHIR 'coding' element to a SubTree.
 * @param {SubTree} subTree SubTree for writing 'coding' data
 * @param {string} subTreePath Path for writing data to SubTree ending with ".coding"
 * @param {Coding} coding Data of 'coding' element
 */
export const writeCodingToSubTree = (subTree: SubTree, subTreePath: string, coding?: Coding): void => {
    if (!coding) return;
    subTree.setValue(subTreePath + ".system", new UriPIO(coding.system as string));
    subTree.setValue(subTreePath + ".version", new StringPIO(coding.version as string));
    subTree.setValue(subTreePath + ".code", new CodePIO(coding.code as string));
    subTree.setValue(subTreePath + ".display", new StringPIO(coding.display as string));
};

/**
 * Deletes a FHIR 'coding' element from a SubTree.
 * @param {SubTree} subTree SubTree for deleting 'coding' data
 * @param {string} subTreePath Path for deleting data from SubTree
 */
export const deleteCodingFromSubTree = (subTree: SubTree, subTreePath: string): void => {
    subTree.deleteValue(subTreePath + ".system");
    subTree.deleteValue(subTreePath + ".version");
    subTree.deleteValue(subTreePath + ".code");
    subTree.deleteValue(subTreePath + ".display");
};

/**
 * Removes all data from a SubTree.
 * @param {SubTree} subTree SubTree for data deletion
 */
export const clearSubTree = (subTree: SubTree): void => {
    subTree.addedPaths = [];
    subTree.children = [];
    subTree.data = undefined;
};

/**
 * Adds or deletes extension interfaces in a React state which holds IExtension[].
 * @param {IExtension[]} reactState React state which holds IExtension[]
 * @param {string} extensionUrl Url of extension which should be deleted or added
 * @param {string} extensionDataType Data type of the extension
 * @param {string} extensionData If data is stated extension will be added, otherwise extension will be deleted.
 */
export const addOrDeleteExtensionInReactState = (
    reactState: IExtension[],
    extensionUrl: string,
    extensionDataType: string,
    extensionData?: string
): void => {
    //Delete old extension, if present
    const indexToDelete: number = reactState.findIndex((item: IExtension): boolean => item.url === extensionUrl);
    if (indexToDelete !== -1) reactState.splice(indexToDelete, 1);

    //Add new extension
    if (extensionData) {
        reactState.push({
            url: extensionUrl,
            value: extensionData,
            dataType: extensionDataType,
        } as IExtension);
    }
};

/**
 * Helper function to iterate through a given object and removing any undefined key/value pairs.
 * @param {{ [key: string]: any }} obj The object to iterate through
 * @returns {object} The object without undefined key/value pairs
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const removeUndefined = (obj: { [key: string]: any }): object => {
    Object.entries(obj).forEach(([key, objValue]): void => {
        if (objValue === undefined) delete obj[key.toString()];
        else if (typeof objValue === "object") obj[key.toString()] = removeUndefined(obj[key.toString()]);
    });
    return obj;
};

/**
 * Extracts a full address string from a IAddressObject interface.
 * @param {IAddressObject} addObj IAddressObject for extraction
 * @returns {string} Full address as string
 */
export const getAddressLabel = (addObj?: IAddressObject): string => {
    if (!addObj) return "";
    const addLocator = addObj.additionalLocator ? `(${addObj.additionalLocator})` : "";
    const streetStr: string | undefined = addObj.street && `${addObj.street} ${addObj.houseNumber ?? ""} ${addLocator}`;
    const cityStr: string | undefined = addObj.city && `${addObj.city} ${addObj.postalCode ?? ""}`;
    const postOfficeStr: string | undefined = addObj.postOfficeBoxNumber && `Postfach ${addObj.postOfficeBoxNumber}`;
    const addressStr: string = `${streetStr ?? ""}${streetStr && cityStr ? ", " : ""}${cityStr ?? ""}`;
    const postOfficeBoxStr: string = `${postOfficeStr ?? ""}${postOfficeStr && cityStr ? ", " : ""}${cityStr ?? ""}`;
    const useStr: string | undefined = addObj.use && addObj.use.toUpperCase();
    return `${useStr ?? "OTHER"}: ${addObj.postOfficeBoxRadio === "true" ? postOfficeBoxStr : addressStr}`;
};

/**
 * Extracts a full name string from a IFullNameObject interface.
 * @param {IFullNameObject} nameObject IFullNameObject for extraction
 * @returns {string} Full name as string
 */
export const getNameLabel = (nameObject?: IFullNameObject): string => {
    if (nameObject === undefined || !nameObject.familyName) return "";
    const familyName: string = nameObject.familyName ? nameObject.familyName + "" : "";
    const givenName: string = nameObject.givenName ? ", " + nameObject.givenName + " " : "";
    const prefix: string = nameObject.prefix ? nameObject.prefix + " " : "";
    const namenszusatz: string = nameObject.namenszusatz ? nameObject.namenszusatz + " " : "";
    const vorsatzwort: string = nameObject.vorsatzwort ? nameObject.vorsatzwort + " " : "";
    return `${prefix}${namenszusatz}${vorsatzwort}${familyName}${givenName}`;
};

/**
 * Extracts a full device name string from a IDeviceObject interface.
 * @param {IDeviceObject} device IDeviceObject for extraction
 * @returns {string} Full device name as string
 */
export const getDeviceLabel = (device?: IDeviceObject): string => {
    if (!device) return "";
    const deviceTypeValueSet: ValueSets = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Device_SNOMED_CT");
    const label: string = `${
        deviceTypeValueSet.getOptionsSync.find(
            (deviceType: SelectOption): boolean => deviceType.value === device.deviceType
        )?.label
    }`;
    return label === "undefined" && device.deviceType ? device.deviceType : label;
};

/**
 * Extracts a full implant name string from a IImplantObject interface.
 * @param {IImplantObject} implant IImplantObject for extraction
 * @returns {string} Full implant name as string
 */
export const getImplantLabel = (implant: IImplantObject): string => {
    if (!implant) return "";
    const implantTypeValueSet: ValueSets = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Medical_Device");
    const displayName: string | undefined = implantTypeValueSet.getOptionsSync.find(
        (implantOption: SelectOption): boolean => implantOption.value === implant.implantType
    )?.label;
    return displayName ?? implant.implantType ?? "";
};

/**
 * Extracts a full organization string from a IOrganizationObject interface.
 * @param {IOrganizationObject} organization IOrganizationObject for extraction
 * @returns {string} Full organization as string
 */
export const getTelecomLabel = (organization: IOrganizationObject): string =>
    organization.telecom
        ?.filter((telecom: ITelecomObject): boolean => telecom.value !== "")
        .map((telecom: ITelecomObject): string => `${telecom.system}: ${telecom.value}`)
        .join(", ") ?? "";

/**
 * Constructs a full path string list for SingleWrapper components based on an optional parentName.
 * @param {IAddressObject} props IAddressObject for extraction
 * @returns {string} Full address as string
 */
export const getFullPath = (props: ISingleWrapperProps): string[] => {
    if (props.fullPath)
        return Array.isArray(props.fullPath) ? [...props.fullPath, props.name] : [props.fullPath, props.name];
    if (props.name !== undefined && props.parentName !== undefined) {
        const parentName: string[] = Array.isArray(props.parentName) ? [...props.parentName] : [props.parentName];
        return Array.isArray(props.name) ? [...parentName, ...props.name] : [...parentName, props.name];
    } else if (props.name !== undefined && props.parentName === undefined) {
        return Array.isArray(props.name) ? props.name : [props.name];
    } else {
        return [];
    }
};

export const getKeyByValue = (object: [key: string], valueToFind: string): string | undefined => {
    for (const key in object) {
        if (object.hasOwnProperty(key) && object[key.toString()] === valueToFind) {
            return key;
        }
    }
    return undefined;
};

/**
 * Checks whether 'code' in 'subTree' is included in 'dropDownOptions'.
 * @param {SubTree} subTree SubTree which holds the coding element
 * @param {string} subPath SubPath which points to the 'coding' subTree
 * @param {SelectOptions} dropDownOptions All drop down options
 * @returns {string | undefined} If code included, it returns the code. If not, the display value of the coding
 */
export const checkCoding = (subTree: SubTree, subPath: string, dropDownOptions: SelectOptions): string | undefined => {
    const codePath: string = subPath === "" ? "code" : subPath + ".code";
    const displayPath: string = subPath === "" ? "display" : subPath + ".display";
    const code: string | undefined = subTree.getSubTreeByPath(codePath).getValueAsString();
    const display: string | undefined = subTree.getSubTreeByPath(displayPath).getValueAsString();

    if (dropDownOptions.find((item: SelectOption): boolean => item.value === code)) return code;
    else return display ? `${display} (nicht unterstützter Code: ${code})` : undefined;
};

/**
 * Checks whether 'code' is included in 'dropDownOptions'.
 * @param {string | undefined} code Code to be checked
 * @param {SelectOptions} dropDownOptions All drop down options
 * @returns {string | undefined} If code included, it returns the code. If not, the manipulated code
 */
export const checkCode = (code: string | undefined, dropDownOptions: SelectOptions): string | undefined => {
    if (!code) return undefined;

    if (dropDownOptions.find((item: SelectOption): boolean => item.value === code)) return code;
    else return code.includes(" (nicht unterstützter Code)") ? code : `${code} (nicht unterstützter Code)`;
};

/**
 * Checks whether all 'codes' in 'subTreeContainer' is included in 'dropDownOptions'.
 * @param {SubTree} subTreeContainer SubTree container which holds multiple subTrees as children
 * @param {string} subPath SubPath which points to the 'coding' subTree within the children of subTree container
 * @param {SelectOptions} dropDownOptions All drop down options
 * @returns {string[]} If code included, it returns the code. If not, the display value of the coding (as array)
 */
export const checkMultipleCoding = (
    subTreeContainer: SubTree,
    subPath: string,
    dropDownOptions: SelectOptions
): string[] => {
    const returnArray: string[] = [];
    subTreeContainer.children.forEach((subTree: SubTree): void => {
        returnArray.push(checkCoding(subTree, subPath, dropDownOptions) ?? "");
    });
    return returnArray.filter((item: string): boolean => item !== "");
};

/**
 * Will detect all codings of subTree which are not part of the states valueSet and which are not included in input field.
 * @param {string[] | undefined} codesFromInputField All codes which are selected in multiple select drop down
 * @param {SubTree} containerSubTree SubTree container which holds multiple codings
 * @param {string} subPath Relative path from subTree Container to coding elements (can be also an empty string)
 * @param {ValueSets} valueSet All values with codes of the valueSet
 * @returns {Coding[] | undefined} All codings which are not included in the stated valueSet
 */
export const getAllUnsupportedCodings = (
    codesFromInputField: string[] | undefined,
    containerSubTree: SubTree,
    subPath: string,
    valueSet: ValueSets
): Coding[] | undefined => {
    return containerSubTree?.children
        .map((subTree: SubTree): Coding | undefined => {
            const codePath: string = subPath === "" ? "code" : `${subPath}.code`;
            const systemPath: string = subPath === "" ? "system" : `${subPath}.system`;
            const versionPath: string = subPath === "" ? "version" : `${subPath}.version`;
            const displayPath: string = subPath === "" ? "display" : `${subPath}.display`;
            const code: string | undefined = subTree.getSubTreeByPath(codePath).getValueAsString();
            const display: string | undefined = subTree.getSubTreeByPath(displayPath).getValueAsString();
            const transformedCodesFromInputField: string[] = codesFromInputField
                ? codesFromInputField.map(
                      (codeFromInputField: string): string => codeFromInputField.split(" (nicht unterstützter Code:")[0]
                  )
                : [];
            if (
                code &&
                display &&
                !valueSet.getObjectByCodeSync(code) &&
                transformedCodesFromInputField?.includes(display)
            ) {
                return {
                    system: subTree.getSubTreeByPath(systemPath).getValueAsString(),
                    version: subTree.getSubTreeByPath(versionPath).getValueAsString(),
                    code: code,
                    display: display,
                } as Coding;
            }
            return undefined;
        })
        .filter((item: Coding | undefined) => item !== undefined) as Coding[];
};

/**
 * Will detect code of subTree which is not part of the states valueSet and which are not included in input field.
 * @param {string | undefined} codeFromInputField Code which is selected in multiple select drop down
 * @param {SubTree} subTree SubTree which holds codings
 * @param {string} subPath Relative path from subTree Container to coding elements (can be also an empty string)
 * @param {ValueSets} valueSet All values with codes of the valueSet
 * @returns {Coding | undefined} Coding which is not included in the stated valueSet
 */
export const getUnsupportedCoding = (
    codeFromInputField: string,
    subTree: SubTree,
    subPath: string,
    valueSet: ValueSets
): Coding | undefined => {
    const codePath: string = subPath === "" ? "code" : `${subPath}.code`;
    const systemPath: string = subPath === "" ? "system" : `${subPath}.system`;
    const versionPath: string = subPath === "" ? "version" : `${subPath}.version`;
    const displayPath: string = subPath === "" ? "display" : `${subPath}.display`;
    const code: string | undefined = subTree.getSubTreeByPath(codePath).getValueAsString();
    const display: string | undefined = subTree.getSubTreeByPath(displayPath).getValueAsString();
    const transformedCodesFromInputField: string = codeFromInputField.split(" (nicht unterstützter Code:")[0];
    if (code && display && !valueSet.getObjectByCodeSync(code) && transformedCodesFromInputField?.includes(display)) {
        return {
            system: subTree.getSubTreeByPath(systemPath).getValueAsString(),
            version: subTree.getSubTreeByPath(versionPath).getValueAsString(),
            code: code,
            display: display,
        } as Coding;
    }
    return undefined;
};

/**
 * Will write all passed unsupported codes to the container subTree.
 * @param {SubTree} containerSubTree SubTree container for writing. Container can hold other elements as well (e.g.
 * "address[0]", "address[1]" and "name")
 * @param {string} containerName Name of the subTree container elements (e.g. container is holding "telecom[0]",
 * telecom[1] ... -> "telecom")
 * @param {string} subPath Relative path from subTree Container to coding elements (can be also an empty string)
 * @param {Coding[] | undefined} unsupportedCodings All unsupported coding which should be written to subTree
 */
export const writeUnsupportedCodingsToSubTree = (
    containerSubTree: SubTree,
    containerName: string,
    subPath: string,
    unsupportedCodings: Coding[] | undefined
): void => {
    if (unsupportedCodings) {
        const partOfPath1: string = `${containerName}[`;
        const partOfPath2: string = subPath === "" ? "]" : `].${subPath}`;
        const nextIndex: number =
            Math.max(
                ...containerSubTree.children.map((subTree: SubTree): number => {
                    return subTree.lastPathElement.split("[")[0] === containerName
                        ? Number(subTree.lastPathElement.split("[")[1].replace("]", ""))
                        : -1;
                })
            ) + 1;
        unsupportedCodings.forEach((coding: Coding, index: number) => {
            writeCodingToSubTree(containerSubTree, partOfPath1 + (nextIndex + index).toString() + partOfPath2, coding);
        });
    }
};

/**
 * Will write passed unsupported code to the subTree.
 * @param {SubTree} subTree SubTree for writing.
 * @param {string} containerName Name of the subTree container elements (e.g. container is holding "telecom[0]",
 * telecom[1] ... -> "telecom")
 * @param {string} subPath Relative path from subTree Container to coding elements (can be also an empty string)
 * @param {Coding | undefined} unsupportedCoding Unsupported coding which should be written to subTree
 */
export const writeUnsupportedCodingToSubTree = (
    subTree: SubTree,
    containerName: string,
    subPath: string,
    unsupportedCoding: Coding | undefined
): void => {
    if (unsupportedCoding) {
        const partOfPath1: string = `${containerName}`;
        const partOfPath2: string = subPath === "" ? "" : `.${subPath}`;
        writeCodingToSubTree(subTree, partOfPath1 + partOfPath2, unsupportedCoding);
    }
};

/**
 * This function will request a coding SubTree from backend. If 'pathToCoding' points to an empty subTree,
 * 'alternativePath' is tried.
 * @param {string} pathToCoding Path for the first try requesting a coding subTree
 * @param {string} alternativePath Path for the second try requesting a coding subTree
 * @returns {Promise<Coding | undefined>} If coding element was found, return Coding interface, otherwise undefined
 */
export const getCodingFromBackend = async (
    pathToCoding: string,
    alternativePath: string
): Promise<Coding | undefined> => {
    const result: IResponse = await PIOService.getSubTrees([pathToCoding, alternativePath]);

    if (result.success) {
        const subTree: SubTree = (result.data?.subTrees as SubTree[])[0];
        const alternativeSubTree: SubTree = (result.data?.subTrees as SubTree[])[1];

        if (subTree.children.length > 0) {
            return {
                system: subTree.getSubTreeByPath("system").getValueAsString(),
                version: subTree.getSubTreeByPath("version").getValueAsString(),
                code: subTree.getSubTreeByPath("code").getValueAsString(),
                display: subTree.getSubTreeByPath("display").getValueAsString(),
            } as Coding;
        } else if (alternativeSubTree.children.length > 0) {
            return {
                system: alternativeSubTree.getSubTreeByPath("system").getValueAsString(),
                version: alternativeSubTree.getSubTreeByPath("version").getValueAsString(),
                code: alternativeSubTree.getSubTreeByPath("code").getValueAsString(),
                display: alternativeSubTree.getSubTreeByPath("display").getValueAsString(),
            } as Coding;
        }
    }
    return undefined;
};

/**
 * This function check if a form contains data or not to trigger conditional rules
 * @param {object} watchedFields Object of watched fields (useWatch hook)
 * @returns {boolean} If form is empty, return false, otherwise true
 */
export const checkFormIsNotEmpty = (watchedFields: object | undefined): boolean => {
    const checkValue = (value: unknown): boolean => {
        if (value === null || value === undefined || value === "") {
            return false;
        }

        if (typeof value === "object") {
            if (Array.isArray(value)) {
                return value.some((item) => checkValue(item));
            } else {
                return Object.values(value).some((nestedValue) => checkValue(nestedValue));
            }
        }

        return true;
    };
    if (!watchedFields) {
        return false;
    }
    return Object.values(watchedFields).some((value) => checkValue(value));
};

/**
 * Function to generate range array from N to M with steps
 * @param {number} from Start value
 * @param {number} to End value
 * @param {number} step Step value
 * @returns {number[]} Array of numbers
 */
export const range = (from: number, to: number, step: number): number[] =>
    [...Array(Math.floor((to - from) / step) + 1)].map((_, i: number) => from + i * step);

export const rangeOptions = (from: number, to: number, step: number, unit?: string): SelectOptions =>
    range(from, to, step).map(
        (value: number): SelectOption => ({
            value: value.toString(),
            label: value.toString() + (unit ? " " + unit : ""),
        })
    );

/**
 * During the conversation from Dayjs to string the automatic time zone correction loses one day. So one day must be
 * added.
 * @param {Dayjs | undefined} dateObject Date object from ant design date picker
 * @returns {string | undefined} Date as string in format "yyyy-mm-ddThh:mm:ss"
 */
export const convertDateJsToString = (dateObject: Dayjs | undefined): string | undefined => {
    if (!dateObject) return undefined;
    const year: string = dateObject.get("year").toString();
    const month: string = (dateObject.get("month") + 1).toString().padStart(2, "0");
    const day: string = dateObject.get("date").toString().padStart(2, "0");
    return `${year}-${month}-${day}T12:00:00`;
};

/**
 * During the conversation from String to DayJs the time must be set to midday otherwise the automatic time zone
 * correction from Dayjs will change the date.
 * @param {string | undefined} dateString Date as string in format "yyyy-mm-ddThh:mm:ss"
 * @returns {Dayjs | undefined} Date object
 */
export const convertStringToDayJs = (dateString: string | undefined): Dayjs | undefined => {
    if (!dateString) return undefined;
    const temp: string = dateString.split("T")[0] + "T12:00:00";
    return dayjs(temp).set("hour", 12).set("minute", 0).set("second", 0);
};

export const handleExpiredToken = (): void => {
    toastHandler.error("Deine Session ist abgelaufen. Du wurdest automatisch abgemeldet.");
    runLogoutTasks();
};
