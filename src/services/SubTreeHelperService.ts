import {
    CodePIO,
    IAddressObject,
    IAllergyObject,
    ICareProblemObject,
    IDeviceObject,
    IFullNameObject,
    IImplantObject,
    IMedicalProblemObject,
    IOrganizationIdentifierObject,
    IOrganizationObject,
    IResponse,
    IRiskObject,
    ITimePeriodObject,
    PrimitiveDataTypes,
    StringPIO,
    SubTree,
    UriPIO,
    UuidPIO,
} from "@thaias/pio_editor_meta";
import { Coding } from "@thaias/pio_fhir_resources";
import { Dayjs } from "dayjs";

import {
    IAddressLine,
    IAddressText,
    IBloodPressureValue,
    IDeviceAid,
    IFamilyType,
    IFormFinishObject,
    INameObject,
    INursingMeasures,
    IOfficialMaiden,
} from "../@types/FormTypes";
import { checkCode, removeUndefined, writeCodingToSubTree } from "./HelperService";
import PIOService from "./PIOService";
import ValueSets from "./ValueSetService";

//Extension URLs as a lookup table object
export const extensionUrls = {
    konfession_religion: "https://fhir.kbv.de/StructureDefinition/KBV_EX_MIO_ULB_Religion",
    translatorNeeded: "https://fhir.kbv.de/StructureDefinition/KBV_EX_MIO_ULB_Interpreter_Required",
    notesForCommunication: "https://fhir.kbv.de/StructureDefinition/KBV_EX_MIO_ULB_Notes_For_Communication",
    birthDateUnknown: "http://hl7.org/fhir/StructureDefinition/data-absent-reason",
    name: {
        nachname: "http://hl7.org/fhir/StructureDefinition/humanname-own-name",
        namenszusatz: "http://fhir.de/StructureDefinition/humanname-namenszusatz",
        vorsatzwort: "http://hl7.org/fhir/StructureDefinition/humanname-own-prefix",
        prefix: "http://hl7.org/fhir/StructureDefinition/iso21090-EN-qualifier",
    },
    address: {
        street: "http://hl7.org/fhir/StructureDefinition/iso21090-ADXP-streetName",
        houseNumber: "http://hl7.org/fhir/StructureDefinition/iso21090-ADXP-houseNumber",
        additionalLocator: "http://hl7.org/fhir/StructureDefinition/iso21090-ADXP-additionalLocator",
        postOfficeBox: "http://hl7.org/fhir/StructureDefinition/iso21090-ADXP-postBox",
        district: "http://hl7.org/fhir/StructureDefinition/iso21090-ADXP-precinct",
    },
    careLevel: {
        pflegegradstatus: "https://fhir.kbv.de/StructureDefinition/KBV_EX_MIO_ULB_Status_Care_Level",
        beantragungsstatus: "https://fhir.kbv.de/StructureDefinition/KBV_EX_MIO_ULB_Application_Status",
        beantragungsdatum: "beantragungsdatum",
        antragsstatus: "antragsstatusPflegegrad",
    },
    receivingOrganization: "https://fhir.kbv.de/StructureDefinition/KBV_EX_MIO_ULB_Reference_Receiving_Institution",
    contactPersons: "https://fhir.kbv.de/StructureDefinition/KBV_EX_MIO_ULB_Reference_Contact_Person",
    allergyAbatement: "https://fhir.kbv.de/StructureDefinition/KBV_EX_Base_AllergyIntolerance_Abatement",
    implant: "https://fhir.kbv.de/StructureDefinition/KBV_EX_MIO_ULB_Terminologie_Assoziation",
    responsibleParty: "https://fhir.kbv.de/StructureDefinition/KBV_EX_Base_Responsible_Person_Organization",
    reasonCause: "https://fhir.kbv.de/StructureDefinition/KBV_EX_MIO_ULB_Reference_Reason_Cause",
    terminology: "https://fhir.kbv.de/StructureDefinition/KBV_EX_MIO_ULB_Terminologie_Assoziation",
    additionalComment: "https://fhir.kbv.de/StructureDefinition/KBV_EX_Base_Additional_Comment",
    genderExtension: "http://fhir.de/StructureDefinition/gender-amtlich-de",
    consentStatement: "https://fhir.kbv.de/StructureDefinition/KBV_EX_MIO_ULB_Consent_Description",
    nursingMeasures: "https://fhir.kbv.de/StructureDefinition/KBV_EX_MIO_ULB_Timetable",
};

/**
 * Helper function to save a Human name to the backend
 * @param {IFormFinishObject} value The values from the Form
 * @param {string} nameSubTree The subtree path to save the name into
 */
export const saveName = (value: IFormFinishObject, nameSubTree?: SubTree): void => {
    nameSubTree?.deleteSubTreeByPath(""); //delete all data in subTree
    const nameObject: IFullNameObject = value.name as IFullNameObject;
    const lookUpTableNameUrls: Record<string, string> = {
        namenszusatz: "http://fhir.de/StructureDefinition/humanname-namenszusatz",
        vorsatzwort: "http://hl7.org/fhir/StructureDefinition/humanname-own-prefix",
        nachname: "http://hl7.org/fhir/StructureDefinition/humanname-own-name",
    };

    const nameObj: INameObject = removeUndefined({
        official: {
            family: {
                nachname: nameObject.familyName,
                namenszusatz: nameObject.namenszusatz,
                vorsatzwort: nameObject.vorsatzwort,
            },
            given: nameObject.givenName,
            prefix: nameObject.prefix,
        },
        maiden: {
            family: {
                nachname: nameObject.geburtsname?.familyName,
                namenszusatz: nameObject.geburtsname?.namenszusatz,
                vorsatzwort: nameObject.geburtsname?.vorsatzwort,
            },
        },
    }) as INameObject;

    /**
     * Extracted function to generate the family name string
     * @param {IFamilyType} family the family object to transform
     * @returns {string} The family string
     */
    const createFamilyValue = (family: IFamilyType): string => {
        const { namenszusatz, vorsatzwort, nachname } = family;
        return `${namenszusatz ?? ""} ${vorsatzwort ?? ""} ${nachname ?? ""}`.trim().replace("  ", " ");
    };

    /**
     * A extracted function to generate the fullName string
     * @param {IOfficialMaiden} officialMaiden A FullName object or the MaidenName
     * @param {string} familyString The family string created by createFamilyValue()
     * @returns {string}: FullName string
     */
    const getFullName = (officialMaiden: IOfficialMaiden, familyString: string): string =>
        `${officialMaiden.prefix ? officialMaiden.prefix + " " : ""}${familyString ?? ""}${
            officialMaiden.given ? ", " + officialMaiden.given : ""
        }`;

    Object.entries(nameObj).forEach(([key, officialMaiden], index: number): void => {
        const family: IFamilyType = officialMaiden.family;
        const familyString: string = createFamilyValue(family);
        const pathPrefix: string = `name[${index}]`;
        const familyFullName: string = getFullName(officialMaiden, familyString);

        // set meta infos
        if (family.nachname) {
            nameSubTree?.setValue(`${pathPrefix}.use`, new StringPIO(key));
            nameSubTree?.setValue(`${pathPrefix}.text`, new StringPIO(familyFullName));
            nameSubTree?.setValue(`${pathPrefix}.family`, new StringPIO(familyString));
        }

        // set nachname, vorsatzwort, namenszusatz
        let extensionIndex: number = 0;
        Object.entries(family).forEach(([familyKey, familyValue]): void => {
            if (familyValue) {
                const url: string = lookUpTableNameUrls[familyKey.toString()];
                const familyValuePIO: StringPIO = new StringPIO(familyValue);
                nameSubTree?.setValue(`${pathPrefix}.family.extension[${extensionIndex}]`, new UriPIO(url));
                nameSubTree?.setValue(`${pathPrefix}.family.extension[${extensionIndex}].valueString`, familyValuePIO);
                extensionIndex++;
            }
        });

        // set prefix
        if (officialMaiden.prefix && officialMaiden.prefix !== "") {
            nameSubTree?.setValue(`${pathPrefix}.prefix`, new StringPIO(officialMaiden.prefix));
            nameSubTree?.setValue(
                `${pathPrefix}.prefix.extension`,
                UriPIO.parseFromString("http://hl7.org/fhir/StructureDefinition/iso21090-EN-qualifier")
            );
            nameSubTree?.setValue(`${pathPrefix}.prefix.extension.valueCode`, CodePIO.parseFromString("AC"));
        }

        // set given
        if (officialMaiden.given) {
            nameSubTree?.setValue(`${pathPrefix}.given`, new StringPIO(officialMaiden.given));
        }
    });
};

// Address Helpers and constants
const lookUpTableNameUrls: Record<string, string> = {
    district: extensionUrls.address.district,
    street: extensionUrls.address.street,
    houseNumber: extensionUrls.address.houseNumber,
    additionalLocator: extensionUrls.address.additionalLocator,
    postOfficeBoxNumber: extensionUrls.address.postOfficeBox,
};
// Counter for nested extensions in one address entry
let extensionCounter: number = 0;

/**
 * Function for setting relevant values and extensions to the Address SubTree
 * Every field of an address will be handled sequentially
 * @param {[string, string]} addressField Address field value containing fieldKey and fieldName
 * @param {string} pathPrefix The path prefix
 * @param {IAddressText} addressText All the relevant Address information as IAddressText object
 * @param {boolean} isPostOfficeBox Boolean if the Address is a postOfficeBox address
 * @param {SubTree} addressSubTree The Subtree to save the address to
 */
const setAddressValues = (
    addressField: [string, string],
    pathPrefix: string,
    addressText: IAddressText,
    isPostOfficeBox: boolean,
    addressSubTree: SubTree
): void => {
    const fieldKey: string = addressField[0];
    const fieldValue: string = addressField[1];
    if (fieldValue) {
        if (Object.keys(lookUpTableNameUrls).includes(fieldKey)) {
            // extensions
            const extObj: { extKey: string; extValue: string; path: string } = {
                extKey: fieldKey,
                extValue: fieldValue,
                path: "",
            };
            // toplevel extension
            if (extObj.extKey === "district") extObj.path = `${pathPrefix}.extension[0]`;
            // nested extensions
            else {
                extObj.path = `${pathPrefix}.line.extension[${extensionCounter}]`;
                addressText.line[extObj.extKey as keyof IAddressLine] = extObj.extValue;
                extensionCounter++;
            }
            const url: string = lookUpTableNameUrls[extObj.extKey.toString()];
            addressSubTree?.setValue(extObj.path, new StringPIO(url));
            addressSubTree?.setValue(`${extObj.path}.valueString`, new StringPIO(extObj.extValue));
        } else if (fieldKey !== "postOfficeBoxRadio") {
            // normal values
            if (addressField[0] === "postalCode" || addressField[0] === "city" || addressField[0] === "country")
                addressText[addressField[0]] = fieldValue;
            addressSubTree?.setValue(`${pathPrefix}.${addressField[0]}`, new StringPIO(fieldValue));
        }
    }
};

/**
 * Helper function to generate the 'line' and 'text' string values for address elements in pio.
 * @param {boolean} isPostOfficeBox If address is a post office box address
 * @param {IAddressText} addressText Interface for optional address values used for the 'text' element in PIO structure
 * @param {IAddressObject} entry The whole address object
 * @returns {{ lineString: string; textString: string }} The 'line' and 'text' values as object
 */
const getAddressStrings = (
    isPostOfficeBox: boolean,
    addressText: IAddressText,
    entry: IAddressObject
): { lineString: string; textString: string } => {
    let lineString: string;
    if (isPostOfficeBox) lineString = entry.postOfficeBoxNumber ?? "";
    else
        lineString =
            `${addressText.line?.street ?? ""} ${addressText.line?.houseNumber ?? ""}`.trim() +
            (addressText.line?.additionalLocator ? `, ${addressText.line.additionalLocator}` : "");
    if (lineString[0] === "," && lineString[1] === " ") lineString = lineString.slice(2); // cut leading ", "
    const postalAndCityString: string = (
        (addressText.postalCode ? addressText.postalCode : "") + (addressText.city ? " " + addressText.city : "")
    ).trim();
    const textString: string =
        lineString +
        (entry.district ? ", " + entry.district : "") +
        (postalAndCityString !== "" ? ", " + postalAndCityString : "") +
        (addressText.country ? ", " + addressText.country : "");
    return { lineString: lineString, textString: textString };
};

/**
 * Helper function to save an address object to a SubTree
 * @param {IFormFinishObject} value The values from the form
 * @param {SubTree} addressSubTree The SubTree to save the address to
 */
export const saveAddresses = (value: IFormFinishObject, addressSubTree?: SubTree): void => {
    //Reset SubTree and return if no addresses are present
    addressSubTree?.deleteSubTreeByPath("");
    const address: IAddressObject[] = value.address as IAddressObject[];
    if (address.length === 0 || address[0] == null) return;

    // Initial loop over all addresses contained in the value object
    Object.entries(value.address as object).forEach((addressEntry: [string, IAddressObject]): void => {
        // Setup address-specific variables
        const entry: IAddressObject = removeUndefined(addressEntry[1]);
        const addressText: IAddressText = { line: [] } as IAddressText;
        const pathPrefix: string = `address[${addressEntry[0]}]`;
        const isPostOfficeBox: boolean = addressEntry[1].postOfficeBoxRadio === "true";

        // Loop over all fields of an address entry and set the specified value in SubTree
        Object.entries(entry).forEach((addressField) => {
            setAddressValues(
                addressField as [string, string],
                pathPrefix,
                addressText,
                isPostOfficeBox,
                addressSubTree as SubTree
            );
            addressSubTree?.setValue(`${pathPrefix}.type`, new StringPIO(isPostOfficeBox ? "postal" : "both"));
        });

        // Construct strings for text and line values
        const addressStrings: { lineString: string; textString: string } = getAddressStrings(
            isPostOfficeBox,
            addressText,
            entry
        );
        addressSubTree?.setValue(`${pathPrefix}.line`, new StringPIO(addressStrings.lineString));
        addressSubTree?.setValue(`${pathPrefix}.text`, new StringPIO(addressStrings.textString));
        extensionCounter = 0;
    });
};

/**
 * Helper function to get the address List from the Form values (IFormFinishObject)
 * @param {SubTree} addressTree The current address SubTree
 * @returns {IAddressObject[]} List of all address objects
 */
export const getAddressListFromFinishObject = (addressTree: SubTree): IAddressObject[] => {
    const addressObjectList: IAddressObject[] = [];
    addressTree?.children.forEach((address: SubTree): void => {
        const addressObject: IAddressObject = {};
        const typeTree: SubTree | undefined = address.children.find((subTree: SubTree): boolean => {
            return subTree.lastPathElement === "type";
        });
        addressObject.postOfficeBoxRadio = typeTree?.getValueAsString() === "postal" ? "true" : "false";
        addressObject.type = typeTree?.getValueAsString() === "postal" ? "postal" : "both";
        address.children.forEach((addressField: SubTree): void => {
            if (addressField.lastPathElement === "line") {
                addressField.children.forEach((lineField: SubTree): void => {
                    switch (lineField.getValueAsString()) {
                        case extensionUrls.address.street:
                            addressObject.street = lineField.children[0].getValueAsString();
                            break;
                        case extensionUrls.address.houseNumber:
                            addressObject.houseNumber = lineField.children[0].getValueAsString();
                            break;
                        case extensionUrls.address.additionalLocator:
                            addressObject.additionalLocator = lineField.children[0].getValueAsString();
                            break;
                        case extensionUrls.address.postOfficeBox:
                            addressObject.postOfficeBoxNumber = lineField.children[0].getValueAsString();
                            break;
                        default:
                            break;
                    }
                });
            } else {
                (addressObject as { [key: string]: string | undefined })[addressField.lastPathElement] =
                    addressField.getValueAsString();
            }
        });
        addressObject.use = address.children
            .find((subTree: SubTree): boolean => {
                return subTree.lastPathElement === "use";
            })
            ?.getValueAsString() as "home" | "work" | "temp" | "old" | "billing" | undefined;
        addressObject.city = address.children
            .find((subTree: SubTree): boolean => {
                return subTree.lastPathElement === "city";
            })
            ?.getValueAsString();
        addressObject.country = checkCode(
            address.children
                .find((subTree: SubTree): boolean => {
                    return subTree.lastPathElement === "country";
                })
                ?.getValueAsString(),
            new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Deuev_Anlage_8").getOptionsSync
        );
        addressObject.postalCode = address.children
            .find((subTree: SubTree): boolean => {
                return subTree.lastPathElement === "postalCode";
            })
            ?.getValueAsString();
        addressObject.district = address.children
            .find((subTree: SubTree): boolean => {
                return subTree.lastPathElement === "extension[0]";
            })
            ?.children[0]?.getValueAsString();
        addressObjectList.push(addressObject);
    });
    return addressObjectList;
};

/**
 * Deletes specific children from a subTree.
 * @param {SubTree} subTree A SubTree object
 * @param {string} partOfLastPathElement All children which include this string in property 'lastPathElement' will be deleted
 * from the subTree
 */
export const deleteChildrenFromSubTree = (subTree: SubTree, partOfLastPathElement: string): void => {
    const indicesForDeleting: number[] = [];
    subTree.children.forEach((child: SubTree, index: number) => {
        if (child.lastPathElement.includes(partOfLastPathElement)) indicesForDeleting.push(index);
    });
    indicesForDeleting.reverse();
    indicesForDeleting.forEach((index: number) => {
        subTree.children.splice(index, 1);
    });
};

/**
 * Returns specific children from a subTree.
 * @param {SubTree} subTree A SubTree object
 * @param {string} partOfLastPathElement All children which include this string in property 'lastPathElement' will be returned
 * @returns {SubTree[]} All children from 'subTree' which include 'partOfLastElement' in property 'lastPathElement'
 */
export const getChildrenFromSubTree = (subTree: SubTree, partOfLastPathElement: string): SubTree[] => {
    const subTrees: SubTree[] = [];
    subTree.children.forEach((child: SubTree) => {
        if (child.lastPathElement.includes(partOfLastPathElement)) subTrees.push(child);
    });
    return subTrees;
};

/**
 * Returns the uuid from a value string
 * @param {string} value Value for UUID in SubTree
 * @returns {string} The uuid from the value string
 */
export const getUuidFromValue = (value: string | undefined): string | undefined => {
    if (value === undefined) return undefined;
    if (value.includes("urn:uuid:")) return value.replace("urn:uuid:", "");
    else return value;
};

/**
 * Writes following static fields for resources that need them:
 * - subject, status, code
 * @param {SubTree} subTree The SubTree to write the static fields to
 * @param {string} subject Patient UUID as string
 * @param {Coding} coding Coding object to be written
 * @param {boolean} status Boolean to decide if status=final is to be written
 */
export const writeStaticFields = (subTree: SubTree, subject?: string, coding?: Coding, status?: boolean): void => {
    if (subject !== undefined) subTree?.setValue("subject.reference", UuidPIO.parseFromString(subject));
    if (status) subTree?.setValue("status", CodePIO.parseFromString("final"));
    if (coding !== undefined) writeCodingToSubTree(subTree, "code.coding", coding);
};

export const onFinishMulti = <
    T extends
        | IMedicalProblemObject
        | ICareProblemObject
        | INursingMeasures
        | IDeviceObject
        | IDeviceAid
        | IImplantObject
        | IRiskObject
        | IAllergyObject,
>(
    multiFindingSubTrees: Record<string, SubTree>,
    findings: T[],
    updateSubTree: (subTree: SubTree, finding: T) => SubTree,
    multiFindingPath: string,
    setMultiFindingSubTrees: (
        value: ((prevState: Record<string, SubTree>) => Record<string, SubTree>) | Record<string, SubTree>
    ) => void
): void => {
    const subTreesToSave: SubTree[] = [];
    const subTreesToDelete: SubTree[] = [];
    const newMultiFindingSubTrees: Record<string, SubTree> = {};

    const existingSubTreeIds: Set<string> = new Set(Object.keys(multiFindingSubTrees));
    if (findings) {
        findings.forEach((finding: T): void => {
            const findingId: string = finding.id.toString();
            const multiSubTreeId: string = findingId;
            const modifiedSubTree: SubTree = updateSubTree(
                multiFindingSubTrees[multiSubTreeId.toString()] ||
                    new SubTree(`${findingId}.${multiFindingPath}`, undefined),
                finding
            );

            subTreesToSave.push(modifiedSubTree);
            existingSubTreeIds.delete(multiSubTreeId);
        });
    }

    existingSubTreeIds.forEach((uuid: string): void => {
        subTreesToDelete.push(multiFindingSubTrees[uuid.toString()]);
    });

    subTreesToSave.forEach((subTree: SubTree): void => {
        newMultiFindingSubTrees[subTree.absolutePath.split(".")[0].toString()] = subTree;
    });

    setMultiFindingSubTrees(newMultiFindingSubTrees);

    if (subTreesToDelete.length > 0) {
        PIOService.deleteSubTrees(subTreesToDelete).then((result: IResponse): void => {
            if (!result.success) console.error(result.message);
        });
    }

    PIOService.saveSubTrees(subTreesToSave).then((result: IResponse): void => {
        if (!result.success) console.error(result.message);
    });
};

/**
 * Helper function to set the value to the SubTree if it exists.
 * @param {string} path Path to the SubTree
 * @param {PrimitiveDataTypes | undefined} value Value to set
 * @param {SubTree} subTree The subTree to save the value into
 */
export const setValueIfExists = (path: string, value: PrimitiveDataTypes | undefined, subTree: SubTree): void => {
    if (value !== undefined && value !== null) {
        subTree.setValue(path, value);
    }
};

/**
 * Helper function to update the SubTree state with the initialized values from the backend
 * @param {SubTree} subTrees SubTrees to be updated
 * @param {Function} setFindingSubTrees Setter for the SubTree state
 */
export const updateFindingState = (
    subTrees: SubTree[],
    setFindingSubTrees: (
        value: ((prevState: Record<string, SubTree>) => Record<string, SubTree>) | Record<string, SubTree>
    ) => void
): void => {
    const newFindingSubTrees: Record<string, SubTree> = subTrees.reduce(
        (acc: Record<string, SubTree>, subTree: SubTree): Record<string, SubTree> => {
            const id: string = subTree.absolutePath.split(".")[0];
            return { ...acc, [id]: subTree };
        },
        {}
    );
    setFindingSubTrees(
        (prevState: Record<string, SubTree>): Record<string, SubTree> => ({
            ...prevState,
            ...newFindingSubTrees,
        })
    );
};

/**
 * Helper function to recursively check an object for any values that are not undefined or empty strings
 * @param {IFormFinishObject
 *          | string
 *         | string[]
 *         | IAddressObject[]
 *         | IOrganizationObject
 *         | IOrganizationIdentifierObject
 *         | IFullNameObject
 *         | Dayjs} obj The object to check or one of its property values
 * @returns {boolean} True if the object contains any values that are not undefined or empty strings
 */
export const checkForNonEmptyValues = (
    obj:
        | IFormFinishObject
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
        | undefined
): boolean => {
    if (obj === undefined || obj === null) {
        return false;
    }

    if (typeof obj !== "object") {
        return obj !== "";
    }

    for (const key in obj) {
        if (obj.hasOwnProperty(key) && checkForNonEmptyValues(obj[key as keyof IFormFinishObject])) {
            return true;
        }
    }

    return false;
};
