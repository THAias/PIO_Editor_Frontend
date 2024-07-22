import {
    CodePIO,
    IAddressObject,
    IContactPersonObject,
    IFullNameObject,
    IMaidenNameObject,
    IOrganizationIdentifierObject,
    IOrganizationObject,
    IPractitionerObject,
    ITelecomObject,
    StringPIO,
    SubTree,
    UriPIO,
    UuidPIO,
    getPrimitiveDataClasses,
} from "@thaias/pio_editor_meta";
import { Coding, SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";

import { IExtension } from "../@types/ReduxTypes";
import { checkCode, checkCoding, getCodingFromBackend, writeCodingToSubTree } from "./HelperService";
import { extensionUrls, saveAddresses, setValueIfExists } from "./SubTreeHelperService";
import UUIDService from "./UUIDService";
import ValueSets from "./ValueSetService";

/**
 * Converts an extension subTree to an array of IExtension interfaces.
 * @param {SubTree} subTree Input which should be converted to IExtension interfaces
 * @returns {IExtension[]} IExtension interfaces as array
 */
export const convertToExtensionInterfaces = (subTree: SubTree): IExtension[] => {
    const array: IExtension[] = [];
    subTree.children?.forEach((child: SubTree): void => {
        array.push({
            url: child.getValue()?.toString(),
            value: child.children[0].getValue()?.toString(),
            dataType: child.children[0].lastPathElement.replace("value", ""),
        } as IExtension);
    });
    return array;
};

/**
 * Converts an array of IExtension interfaces to one subTree container. 'basePath' key of all IExtension interfaces must be identical.
 * @param {IExtension[]} extInterfaces Extension interfaces for conversation
 * @param {string} basePath Absolute path starting with an uuid pointing to the extension in the PIO (ending with "extension")
 * @returns {SubTree} A subTree container holding all extensions
 */
export const convertToExtensionSubTree = (extInterfaces: IExtension[], basePath: string): SubTree => {
    const extSubTree: SubTree = new SubTree(basePath, undefined);
    extInterfaces.forEach((ext: IExtension, index: number): void => {
        extSubTree.setValue("extension[" + index + "]", new UriPIO(ext.url));
        extSubTree.setValue(
            "extension[" + index + "].value" + ext.dataType,
            getPrimitiveDataClasses()[ext.dataType + "PIO"].parseFromString(ext.value)
        );
    });
    return extSubTree;
};

/**
 * Converts an array of human name subTrees to IFullNameObject interface.
 * @param {SubTree[]} subTrees Input which should be converted to IFullNameObject interface. Array can hold up to two
 * items. One item is representing the full name and the other item is representing the birth name.
 * @returns {IFullNameObject} IFullNameObject interface
 */
const convertToFullNameInterface = (subTrees: SubTree[]): IFullNameObject => {
    const fullNameObject: IFullNameObject = {} as IFullNameObject;
    subTrees.forEach((subTree: SubTree): void => {
        if (subTree.getSubTreeByPath("use").getValueAsString() === "maiden") {
            //Write birth name to interface
            const maidenNameObject: IMaidenNameObject = {} as IMaidenNameObject;
            const extensionSubTree: SubTree = subTree.getSubTreeByPath("family.extension");

            const birthFamilyName: string | undefined = extensionSubTree.children
                .find((child: SubTree) => child.data?.toString() === extensionUrls.name.nachname)
                ?.getSubTreeByPath("valueString")
                .getValueAsString();
            maidenNameObject.familyName = birthFamilyName ? birthFamilyName : "";
            maidenNameObject.vorsatzwort = extensionSubTree.children
                .find((child: SubTree) => child.data?.toString() === extensionUrls.name.vorsatzwort)
                ?.getSubTreeByPath("valueString")
                .getValueAsString();
            maidenNameObject.namenszusatz = extensionSubTree.children
                .find((child: SubTree) => child.data?.toString() === extensionUrls.name.namenszusatz)
                ?.getSubTreeByPath("valueString")
                .getValueAsString();
            fullNameObject.geburtsname = maidenNameObject;
        } else {
            //Write full name to interface
            const extensionSubTree: SubTree = subTree.getSubTreeByPath("family.extension");
            const fullFamilyName: string | undefined = extensionSubTree.children
                .find((child: SubTree) => child.data?.toString() === extensionUrls.name.nachname)
                ?.getSubTreeByPath("valueString")
                .getValueAsString();
            fullNameObject.familyName = fullFamilyName ? fullFamilyName : "";
            fullNameObject.vorsatzwort = extensionSubTree.children
                .find((child: SubTree) => child.data?.toString() === extensionUrls.name.vorsatzwort)
                ?.getSubTreeByPath("valueString")
                .getValueAsString();
            fullNameObject.namenszusatz = extensionSubTree.children
                .find((child: SubTree) => child.data?.toString() === extensionUrls.name.namenszusatz)
                ?.getSubTreeByPath("valueString")
                .getValueAsString();

            fullNameObject.givenName = subTree.getSubTreeByPath("given").getValueAsString();
            fullNameObject.prefix = subTree.getSubTreeByPath("prefix").getValueAsString();
        }
    });

    return fullNameObject;
};

/**
 * Converts an array of address subTrees to IAddressObject interfaces.
 * @param {SubTree[]} subTrees Input which should be converted to IAddressObject interfaces
 * @returns {IAddressObject[]} IAddressObject interfaces
 */
const convertToAddressInterfaces = (subTrees: SubTree[]): IAddressObject[] => {
    const addressArray: IAddressObject[] = [];
    subTrees.forEach((subTree: SubTree): void => {
        const postOfficeBoxNumber: string | undefined = subTree
            .getSubTreeByPath("line.extension")
            .children.find((child: SubTree) => child.data?.toString() === extensionUrls.address.postOfficeBox)
            ?.getSubTreeByPath("valueString")
            .getValueAsString();
        const extensionSubTree: SubTree = subTree.getSubTreeByPath("line.extension");

        addressArray.push({
            use: subTree.getSubTreeByPath("use").getValueAsString(),
            district:
                subTree.getSubTreeByPath("extension.valueString").getValueAsString() ??
                subTree.getSubTreeByPath("extension[0].valueString").getValueAsString(),
            city: subTree.getSubTreeByPath("city").getValueAsString(),
            country: checkCode(
                subTree.getSubTreeByPath("country").getValueAsString(),
                new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Deuev_Anlage_8").getOptionsSync
            ),
            postalCode: subTree.getSubTreeByPath("postalCode").getValueAsString(),
            street: postOfficeBoxNumber
                ? undefined
                : extensionSubTree.children
                      .find((child: SubTree) => child.data?.toString() === extensionUrls.address.street)
                      ?.getSubTreeByPath("valueString")
                      .getValueAsString(),
            houseNumber: postOfficeBoxNumber
                ? undefined
                : extensionSubTree.children
                      .find((child: SubTree) => child.data?.toString() === extensionUrls.address.houseNumber)
                      ?.getSubTreeByPath("valueString")
                      .getValueAsString(),
            additionalLocator: postOfficeBoxNumber
                ? undefined
                : extensionSubTree.children
                      .find((child: SubTree) => child.data?.toString() === extensionUrls.address.additionalLocator)
                      ?.getSubTreeByPath("valueString")
                      .getValueAsString(),
            postOfficeBoxNumber: postOfficeBoxNumber,
            postOfficeBoxRadio: postOfficeBoxNumber ? "true" : "false",
        } as IAddressObject);
    });
    return addressArray;
};

/**
 * Converts an array of telecom subTrees to ITelecomObject interfaces.
 * @param {SubTree[]} subTrees Input which should be converted to ITelecomObject interfaces
 * @returns {ITelecomObject[]} ITelecomObject interfaces
 */
const convertToTelecomInterfaces = (subTrees: SubTree[]): ITelecomObject[] => {
    const telecomArray: ITelecomObject[] = [];
    subTrees.forEach((subTree: SubTree): void => {
        const system: string | undefined = subTree.getSubTreeByPath("system").getValueAsString();
        const value: string | undefined = subTree.getSubTreeByPath("value").getValueAsString();

        const telecomTypeValueSet: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/contact-point-system");
        const telecomSystemOptions: SelectOptions = telecomTypeValueSet.getOptionsSync;
        const label: string | undefined = telecomSystemOptions.find(
            (option: SelectOption): boolean => option.value === system
        )?.label;

        telecomArray.push({
            label: label ?? "",
            system: system ?? "",
            value: value ?? "",
        } as ITelecomObject);
    });
    return telecomArray;
};

/**
 * Converts an contactPerson subTree array to an array of IContactPersonObject interfaces.
 * @param {SubTree[]} subTrees Input which should be converted to IContactPersonObject interfaces. SubTrees should hold
 * following absolute path: "uuid.KBV_PR_MIO_ULB_RelatedPerson_Contact_Person"
 * @returns {IContactPersonObject[]} IContactpersonObject interfaces as array
 */
export const convertToContactPersonInterfaces = (subTrees: SubTree[]): IContactPersonObject[] => {
    const array: IContactPersonObject[] = [];
    subTrees.forEach((subTree: SubTree): void => {
        const genderCode: string | undefined = subTree.getSubTreeByPath("gender").getValueAsString();
        const roleOptions: SelectOptions = new ValueSets("http://hl7.org/fhir/ValueSet/relatedperson-relationshiptype")
            .getOptionsSync;
        const genderValueSet: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/administrative-gender");
        const genderOtherValueSet: ValueSets = new ValueSets("http://fhir.de/ValueSet/gender-other-de");
        const genderOptions: SelectOptions = genderValueSet.getOptionsSync
            .filter((item: SelectOption): boolean => item.value !== "other")
            .concat(genderOtherValueSet.getOptionsSync);

        array.push({
            id: subTree.absolutePath.split(".")[0],
            role:
                checkCoding(subTree, "relationship.coding", roleOptions) ??
                checkCoding(subTree, "relationship[0].coding", roleOptions),
            gender:
                genderCode === "other"
                    ? subTree.getSubTreeByPath("gender.extension.valueCoding.code").getValueAsString() ||
                      subTree.getSubTreeByPath("gender.extension[0].valueCoding.code").getValueAsString()
                    : checkCode(genderCode, genderOptions),
            name: convertToFullNameInterface(
                subTree.children.filter((child: SubTree) => child.lastPathElement.includes("name"))
            ),
            address: convertToAddressInterfaces(
                subTree.children.filter((child: SubTree) => child.lastPathElement.includes("address"))
            ),
            telecom: convertToTelecomInterfaces(
                subTree.children.filter((child: SubTree) => child.lastPathElement.includes("telecom"))
            ),
        } as IContactPersonObject);
    });
    return array;
};

/**
 * Function which generates the family name (out of family, namenszusatz and vorsatzwort) and the full name (all
 * parameter used).
 * @param {string | undefined} namenszusatz Addition to family name (e.g. "Prince")
 * @param {string | undefined} vorsatzwort Addition to family name (e.g. "von" or "zu")
 * @param {string} family The family name
 * @param {string | undefined} prefix A name prefix (e.g. "Dr.")
 * @param {string | undefined} given The first name
 * @returns {string[]} The first array item is the family name as string, the second one the full name as string
 */
const generateFamilyAndFullNameString = (
    namenszusatz: string | undefined,
    vorsatzwort: string | undefined,
    family: string,
    prefix: string | undefined,
    given: string | undefined
): string[] => {
    const nameArray: string[] = [];
    nameArray.push(`${namenszusatz ? namenszusatz + " " : ""}${vorsatzwort ? vorsatzwort + " " : ""}${family}`);
    nameArray.push(`${prefix ? prefix + " " : ""}${nameArray[0]}${given ? ", " + given : ""}`);
    return nameArray;
};

/**
 * Converts an IFullNameObject interface to a subTree.
 * @param {IFullNameObject} nameObject Input which should be converted to subTree
 * @param {string} basePath Path which should be used as 'absolutePath' for the subTree generation excluding the 'name'
 * path element
 * @returns {SubTree[]} Array of one or two subTrees. These two subTrees are representing the full name and the birth
 * name. The birth name is optional and always the second item in the array.
 */
const convertToFullNameSubTree = (nameObject: IFullNameObject, basePath: string): SubTree[] => {
    const array: SubTree[] = [];

    //Generate name subTree
    const path: string = nameObject.geburtsname ? basePath + ".name[0]" : basePath + ".name";
    const nameSubTree: SubTree = new SubTree(path, undefined);

    nameSubTree.setValue("use", new CodePIO("official"));
    if (nameObject.givenName) nameSubTree.setValue("given", new StringPIO(nameObject.givenName));
    if (nameObject.prefix) {
        nameSubTree.setValue("prefix", new StringPIO(nameObject.prefix));
        nameSubTree.setValue("prefix.extension[0]", new UriPIO(extensionUrls.name.prefix));
        nameSubTree.setValue("prefix.extension[0].valueCode", new CodePIO("AC"));
    }

    nameSubTree.setValue("family.extension[0]", new UriPIO(extensionUrls.name.nachname));
    nameSubTree.setValue("family.extension[0].valueString", new StringPIO(nameObject.familyName));
    let indexCounter: number = 1;
    if (nameObject.namenszusatz) {
        nameSubTree.setValue(`family.extension[${indexCounter}]`, new UriPIO(extensionUrls.name.namenszusatz));
        nameSubTree.setValue(`family.extension[${indexCounter}].valueString`, new StringPIO(nameObject.namenszusatz));
        indexCounter++;
    }
    if (nameObject.vorsatzwort) {
        nameSubTree.setValue(`family.extension[${indexCounter}]`, new UriPIO(extensionUrls.name.vorsatzwort));
        nameSubTree.setValue(`family.extension[${indexCounter}].valueString`, new StringPIO(nameObject.vorsatzwort));
    }

    const familyAndFullName: string[] = generateFamilyAndFullNameString(
        nameObject.namenszusatz,
        nameObject.vorsatzwort,
        nameObject.familyName,
        nameObject.prefix,
        nameObject.givenName
    );
    nameSubTree.setValue("family", new StringPIO(familyAndFullName[0]));
    nameSubTree.setValue("text", new StringPIO(familyAndFullName[1]));

    array.push(nameSubTree);

    //Generate birth name subTree
    if (nameObject.geburtsname) {
        const birthSubTree: SubTree = new SubTree(basePath + ".name[1]", undefined);

        birthSubTree.setValue("use", new CodePIO("maiden"));

        birthSubTree.setValue("family.extension[0]", new UriPIO(extensionUrls.name.nachname));
        birthSubTree.setValue("family.extension[0].valueString", new StringPIO(nameObject.geburtsname.familyName));
        let indexCounter2: number = 1;
        if (nameObject.geburtsname.namenszusatz) {
            birthSubTree.setValue(`family.extension[${indexCounter2}]`, new UriPIO(extensionUrls.name.namenszusatz));
            birthSubTree.setValue(
                `family.extension[${indexCounter2}].valueString`,
                new StringPIO(nameObject.geburtsname.namenszusatz)
            );
            indexCounter2++;
        }
        if (nameObject.geburtsname.vorsatzwort) {
            birthSubTree.setValue(`family.extension[${indexCounter2}]`, new UriPIO(extensionUrls.name.vorsatzwort));
            birthSubTree.setValue(
                `family.extension[${indexCounter2}].valueString`,
                new StringPIO(nameObject.geburtsname.vorsatzwort)
            );
        }

        const fullString: string = `${
            nameObject.geburtsname.namenszusatz ? nameObject.geburtsname.namenszusatz + " " : ""
        }${nameObject.geburtsname.vorsatzwort ? nameObject.geburtsname.vorsatzwort + " " : ""}${
            nameObject.geburtsname.familyName
        }`;
        birthSubTree.setValue("family", new StringPIO(fullString));
        birthSubTree.setValue("text", new StringPIO(fullString));

        array.push(birthSubTree);
    }

    return array;
};

/**
 * Converts IAddressObject interfaces to a subTree.
 * @param {IAddressObject[]} addressObject Input which should be converted to subTree
 * @param {string} basePath Path which should be used as 'absolutePath' for the subTree generation excluding the
 * 'address' path element
 * @returns {SubTree[]} Array of one or more subTrees representing addresses
 */
const convertToAddressSubTrees = (addressObject: IAddressObject[], basePath: string): SubTree[] => {
    const tempSubTree: SubTree = new SubTree(basePath, undefined);
    saveAddresses({ address: addressObject }, tempSubTree);
    return tempSubTree.children;
};

/**
 * Converts ITelecomObject interfaces to a subTree.
 * @param {ITelecomObject[]} telecomObject Input which should be converted to subTree
 * @param {string} basePath Path which should be used as 'absolutePath' for the subTree generation excluding the
 * 'telecom' path element
 * @returns {SubTree[]} Array of one or more subTrees representing telecoms
 */
const convertToTelecomSubTrees = (telecomObject: ITelecomObject[], basePath: string): SubTree[] => {
    const array: SubTree[] = [];

    //Generate telecom SubTrees
    let counter: number = 0;
    telecomObject.forEach((telecom: ITelecomObject) => {
        if (telecom.value !== undefined && telecom.value !== "") {
            const subTree: SubTree = new SubTree(basePath + ".telecom[" + counter + "]", undefined);
            subTree.setValue("system", new CodePIO(telecom.system));
            subTree.setValue("value", new StringPIO(telecom.value));
            array.push(subTree);
            counter++;
        }
    });

    return array;
};

/**
 * Converts an array of IContactPersonObject interfaces to an array of subTrees pointing to
 * "uuid.KBV_PR_MIO_ULB_RelatedPerson_Contact_Person". The id key of the interface will get the uuid for the contact
 * person resource.
 * @param {IContactPersonObject[]} contPersInter Contact person interfaces for conversation
 * @returns {SubTree[]} A subTree array holding all contact persons
 */
export const convertToContactPersonSubTrees = (contPersInter: IContactPersonObject[]): SubTree[] => {
    const array: SubTree[] = [];
    contPersInter.forEach((contactPerson: IContactPersonObject): void => {
        const subTree: SubTree = new SubTree(
            contactPerson.id + ".KBV_PR_MIO_ULB_RelatedPerson_Contact_Person",
            undefined
        );

        // add patient to relatedPerson
        subTree.setValue("patient.reference", UuidPIO.parseFromString(UUIDService.getUUID("KBV_PR_MIO_ULB_Patient")));

        //Write 'role' to subTree
        const roleValueSet: ValueSets = new ValueSets("http://hl7.org/fhir/ValueSet/relatedperson-relationshiptype");
        const coding: Coding | undefined = contactPerson.role
            ? roleValueSet.getObjectByCodeSync(contactPerson.role)
            : undefined;
        if (coding) writeCodingToSubTree(subTree, "relationship.coding", coding);

        //Write 'gender' to subTree
        if (contactPerson.gender && contactPerson.gender !== "X" && contactPerson.gender !== "D") {
            subTree.setValue("gender", new CodePIO(contactPerson.gender));
        } else if (contactPerson.gender && (contactPerson.gender === "X" || contactPerson.gender === "D")) {
            subTree.setValue("gender", new CodePIO("other"));
            subTree.setValue("gender.extension", new UriPIO(extensionUrls.genderExtension));
            const genderOtherValueSet: ValueSets = new ValueSets("http://fhir.de/ValueSet/gender-other-de");
            const genderOtherCoding: Coding | undefined = genderOtherValueSet.getObjectByCodeSync(contactPerson.gender);
            writeCodingToSubTree(subTree, "gender.extension.valueCoding", genderOtherCoding);
        }

        //Write 'name', 'address' and 'telecom' to subTree
        if (contactPerson.name)
            subTree.children.push(...convertToFullNameSubTree(contactPerson.name, subTree.absolutePath));
        if (contactPerson.address)
            subTree.children.push(...convertToAddressSubTrees(contactPerson.address, subTree.absolutePath));
        if (contactPerson.telecom)
            subTree.children.push(...convertToTelecomSubTrees(contactPerson.telecom, subTree.absolutePath));

        //Add contact person subTree to array
        array.push(subTree);
    });

    return array;
};

/**
 * This function writes all data from a practitioner interface to a SubTree.
 * @param {IPractitionerObject} pract Practitioner interface as input
 * @param {SubTree} practSubTree Practitioner SubTree which is the output
 */
const writeDataToPractitionerSubTree = async (pract: IPractitionerObject, practSubTree: SubTree): Promise<void> => {
    //Write extension and qualification to practitioner subTree
    if (pract.additionalInfo) {
        practSubTree.setValue("extension", new UriPIO(extensionUrls.additionalComment));
        practSubTree.setValue("extension.valueString", new StringPIO(pract.additionalInfo));
    }
    if (pract.qualification) {
        const qualificationValueSet: ValueSets = new ValueSets(
            "https://fhir.kbv.de/ValueSet/KBV_VS_Base_Practitioner_Speciality"
        );
        let coding: Coding | undefined = qualificationValueSet.getObjectByCodeSync(pract.qualification);
        if (!coding)
            coding = await getCodingFromBackend(
                pract.id + ".KBV_PR_MIO_ULB_Practitioner.qualification.code.coding",
                pract.id + ".KBV_PR_MIO_ULB_Practitioner.qualification[0].code.coding"
            );
        if (coding && coding.version == null) coding.version = "1.3.0";
        writeCodingToSubTree(practSubTree, "qualification.code.coding", coding);
    }

    //Write 'name', 'address' and 'telecom' to practitioner subTree
    if (pract.practitionerName)
        practSubTree.children.push(convertToFullNameSubTree(pract.practitionerName, practSubTree.absolutePath)[0]);
    if (pract.address)
        practSubTree.children.push(...convertToAddressSubTrees(pract.address, practSubTree.absolutePath));
    if (pract.telecom)
        practSubTree.children.push(...convertToTelecomSubTrees(pract.telecom, practSubTree.absolutePath));

    //Write identifier to practitioner subTree
    let counter: number = 0;
    if (pract.ANR) {
        const identifierPath: string = "identifier[" + counter + "]";
        practSubTree.setValue(identifierPath + ".use", new CodePIO("official"));
        practSubTree.setValue(
            identifierPath + ".type.coding.system",
            new UriPIO("http://terminology.hl7.org/CodeSystem/v2-0203")
        );
        practSubTree.setValue(identifierPath + ".type.coding.code", new CodePIO("LANR"));
        practSubTree.setValue(identifierPath + ".type.coding.display", new StringPIO("Lifelong physician number"));
        practSubTree.setValue(
            identifierPath + ".system",
            new UriPIO("https://fhir.kbv.de/NamingSystem/KBV_NS_Base_ANR")
        );
        practSubTree.setValue(identifierPath + ".value", new StringPIO(pract.ANR));
        counter++;
    }
    if (pract.EFN) {
        const identifierPath: string = "identifier[" + counter + "]";
        practSubTree.setValue(identifierPath + ".use", new CodePIO("official"));
        practSubTree.setValue(
            identifierPath + ".type.coding.system",
            new UriPIO("http://terminology.hl7.org/CodeSystem/v2-0203")
        );
        practSubTree.setValue(identifierPath + ".type.coding.code", new CodePIO("DN"));
        practSubTree.setValue(identifierPath + ".type.coding.display", new StringPIO("Doctor number"));
        practSubTree.setValue(identifierPath + ".system", new UriPIO("http://fhir.de/sid/bundesaerztekammer/efn"));
        practSubTree.setValue(identifierPath + ".value", new StringPIO(pract.EFN));
        counter++;
    }
    if (pract.ZANR) {
        const identifierPath: string = "identifier[" + counter + "]";
        practSubTree.setValue(identifierPath + ".use", new CodePIO("official"));
        practSubTree.setValue(
            identifierPath + ".type.coding.system",
            new UriPIO("http://fhir.de/CodeSystem/identifier-type-de-basis")
        );
        practSubTree.setValue(identifierPath + ".type.coding.code", new CodePIO("ZANR"));
        practSubTree.setValue(identifierPath + ".type.coding.display", new StringPIO("Zahnarztnummer"));
        practSubTree.setValue(identifierPath + ".system", new UriPIO("http://fhir.de/sid/kzbv/zahnarztnummer"));
        practSubTree.setValue(identifierPath + ".value", new StringPIO(pract.ZANR));
    }
};

/**
 * Converts an array of IPractitionerObject interfaces to an array of subTrees pointing to
 * "uuid.KBV_PR_MIO_ULB_Practitioner" and "uuid2.KBV_PR_MIO_ULB_PractitionerRole". For each interface one practitioner
 * and one practitionerRole subTree is generated. The id key of the interface will get the uuid for the practitioner
 * resource. The practitionerRole resource gets a new uuid.
 * @param {IPractitionerObject[]} practitionerInterfaces Practitioner interfaces for conversation
 * @param {SubTree[] | undefined} practitionerRoleSubTrees Optional parameter. This array must be as long as
 * 'practitionerInterfaces'. The uuid of these subTrees will be used for generating the PractitionerRole subTrees. This
 * is important, when updating practitioners because the uuid needs to be static in this case.
 * @returns {{practitioner: SubTree[]; practitionerRole: SubTree[]}} Converted practitioner and practitionerRole SubTrees.
 * The first array item under practitioner key belongs to the first array item under practitionerRole.
 */
export const convertToPractitionerSubTrees = async (
    practitionerInterfaces: IPractitionerObject[],
    practitionerRoleSubTrees: SubTree[] | undefined
): Promise<{ practitioner: SubTree[]; practitionerRole: SubTree[] }> => {
    const returnObject: { practitioner: SubTree[]; practitionerRole: SubTree[] } = {
        practitioner: [] as SubTree[],
        practitionerRole: [] as SubTree[],
    };

    //Get the uuid of the first practitionerRole resource, which belongs to each IPractitionerObject, and bundle data in one object
    const bundledData: { practObj: IPractitionerObject; roleUuid: string | undefined }[] = [];
    practitionerInterfaces.forEach((pract: IPractitionerObject) => {
        const roleUuid: string | undefined = practitionerRoleSubTrees
            ?.find((subTree: SubTree) => pract.id === subTree.getSubTreeByPath("practitioner.reference").data?.get())
            ?.absolutePath.split(".")[0];
        bundledData.push({ practObj: { ...pract }, roleUuid: roleUuid });
    });

    //Generate SubTrees
    for (const data of bundledData) {
        const practSubTree: SubTree = new SubTree(data.practObj.id + ".KBV_PR_MIO_ULB_Practitioner", undefined);
        const practRoleSubTree: SubTree = new SubTree(
            data.roleUuid
                ? data.roleUuid + ".KBV_PR_MIO_ULB_PractitionerRole"
                : UuidPIO.generateUuid() + ".KBV_PR_MIO_ULB_PractitionerRole",
            undefined
        );

        await writeDataToPractitionerSubTree(data.practObj, practSubTree);

        //Add references to practitionerRole subTree
        practRoleSubTree.setValue("practitioner.reference", new UuidPIO(data.practObj.id));
        try {
            practRoleSubTree.setValue("organization.reference", new UuidPIO(data.practObj.organization));
        } catch {}

        //Write 'code' and 'speciality' to practitionerRole subTree
        if (data.practObj.role) {
            const roleValueSet: ValueSets = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Rolecare");
            let coding: Coding | undefined = roleValueSet.getObjectByCodeSync(data.practObj.role);
            if (!coding && data.roleUuid)
                coding = await getCodingFromBackend(
                    data.roleUuid + ".KBV_PR_MIO_ULB_PractitionerRole.code.coding",
                    data.roleUuid + ".KBV_PR_MIO_ULB_PractitionerRole.code[0].coding"
                );
            writeCodingToSubTree(practRoleSubTree, "code.coding", coding);
        }
        if (data.practObj.speciality) {
            const specialtyValueSet: ValueSets = new ValueSets(
                "https://fhir.kbv.de/ValueSet/KBV_VS_SFHIR_BAR2_ARZTNRFACHGRUPPE"
            );
            let coding: Coding | undefined = specialtyValueSet.getObjectByCodeSync(data.practObj.speciality);
            if (!coding && data.roleUuid)
                coding = await getCodingFromBackend(
                    data.roleUuid + ".KBV_PR_MIO_ULB_PractitionerRole.specialty.coding",
                    data.roleUuid + ".KBV_PR_MIO_ULB_PractitionerRole.specialty[0].coding"
                );
            writeCodingToSubTree(practRoleSubTree, "specialty.coding", coding);
        }

        //Add subTrees to returnObject
        returnObject.practitioner.push(practSubTree);
        returnObject.practitionerRole.push(practRoleSubTree);
    }

    return returnObject;
};

/**
 * Converts multiple Practitioner SubTrees and PractitionerRole SubTrees to an array of IPractitionerObjects. For each
 * generated interface one practitioner and one practitionerRole subTree is needed. The subTrees are pointing to
 * "uuid.KBV_PR_MIO_ULB_Practitioner" and "uuid2.KBV_PR_MIO_ULB_PractitionerRole". If the number of practitioner and
 * practitionerRole subTrees are not equal, each practitioner subTree will be converted to one interface. Less
 * practitionerRole than practitioner subTrees will lead to missing information in interface. More practitionerRole than
 * practitioner subTrees will lead to remaining practitionerRole information, which are not converted to interfaces. PIO
 * editor can match one practitionerRole to one practitioner. If two practitionerRole are matching with one
 * practitioner, the first one is converted and the second one ignored. The array order is not important, because the
 * function will sort the subTree arrays.
 * @param {SubTree[]} practitionerSubTrees Practitioner SubTrees in a random order
 * @param {SubTree[]} practitionerRoleSubTrees PractitionerRole SubTrees in a random order
 * @param {string[]} authorUuids The uuids of the authors of the pio to set the author flag in the practitioner object
 * @returns {IPractitionerObject[]} Converted IPractitionerObjects
 */
export const convertToPractitionerInterfaces = (
    practitionerSubTrees: SubTree[],
    practitionerRoleSubTrees: SubTree[],
    authorUuids: string[]
): IPractitionerObject[] => {
    //Sort subTree arrays
    const sorted: { practitioner: SubTree; role: SubTree | undefined }[] = [];
    practitionerSubTrees.forEach((pract: SubTree) => {
        const role: SubTree | undefined = practitionerRoleSubTrees.find(
            (practRole: SubTree) =>
                pract.absolutePath.split(".")[0] === practRole.getSubTreeByPath("practitioner.reference").data?.get()
        );
        if (role) sorted.push({ practitioner: { ...pract } as SubTree, role: { ...role } as SubTree });
        else sorted.push({ practitioner: { ...pract } as SubTree, role: undefined });
    });

    //Log all practitionerRole SubTrees which are ignored due to PIOSmall limitations
    const excludedSubTrees: SubTree[] = [];
    practitionerRoleSubTrees.forEach((subTree: SubTree) => {
        if (
            sorted.find(
                (item: { practitioner: SubTree; role: SubTree | undefined }) =>
                    item.role?.absolutePath.split(".")[0] === subTree.absolutePath.split(".")[0]
            ) === undefined
        ) {
            excludedSubTrees.push(subTree);
        }
    });
    if (excludedSubTrees.length > 0) {
        console.warn("PractitionerRole SubTrees which are ignored due to PIOSmall limitations:");
        console.warn(excludedSubTrees);
    }

    //Generate return array
    const returnArray: IPractitionerObject[] = [];
    sorted.forEach((item: { practitioner: SubTree; role: SubTree | undefined }) => {
        const practitionerUuid: string = item.practitioner.absolutePath.split(".")[0];
        const isAuthor: boolean = authorUuids ? authorUuids.includes(practitionerUuid) : false;
        const qualificationOptions: SelectOptions = new ValueSets(
            "https://fhir.kbv.de/ValueSet/KBV_VS_Base_Practitioner_Speciality"
        ).getOptionsSync;
        const specialityOptions: SelectOptions = new ValueSets(
            "https://fhir.kbv.de/ValueSet/KBV_VS_SFHIR_BAR2_ARZTNRFACHGRUPPE"
        ).getOptionsSync;
        const roleOptions: SelectOptions = new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_Base_Rolecare")
            .getOptionsSync;
        returnArray.push({
            id: practitionerUuid,
            additionalInfo:
                item.practitioner.getSubTreeByPath("extension.valueString").getValueAsString() ??
                item.practitioner.getSubTreeByPath("extension[0].valueString").getValueAsString(),
            organization: item.role?.getSubTreeByPath("organization.reference").data?.get() ?? "",
            qualification:
                checkCoding(item.practitioner, "qualification.code.coding", qualificationOptions) ??
                checkCoding(item.practitioner, "qualification[0].code.coding", qualificationOptions),
            role: item.role
                ? (checkCoding(item.role, "code.coding", roleOptions) ??
                  checkCoding(item.role, "code[0].coding", roleOptions))
                : undefined,
            speciality: item.role
                ? (checkCoding(item.role, "specialty.coding", specialityOptions) ??
                  checkCoding(item.role, "specialty[0].coding", specialityOptions))
                : undefined,
            practitionerName: convertToFullNameInterface(
                item.practitioner.children.filter((child: SubTree) => child.lastPathElement.includes("name"))
            ),
            address: convertToAddressInterfaces(
                item.practitioner.children.filter((child: SubTree) => child.lastPathElement.includes("address"))
            ),
            telecom: convertToTelecomInterfaces(
                item.practitioner.children.filter((child: SubTree) => child.lastPathElement.includes("telecom"))
            ),
            ZANR: item.practitioner.children
                .filter((child: SubTree) => child.lastPathElement.includes("identifier"))
                .find((subTree: SubTree) => subTree.getSubTreeByPath("type.coding.code").getValueAsString() === "ZANR")
                ?.getSubTreeByPath("value")
                .getValueAsString(),
            EFN: item.practitioner.children
                .filter((child: SubTree) => child.lastPathElement.includes("identifier"))
                .find((subTree: SubTree) => subTree.getSubTreeByPath("type.coding.code").getValueAsString() === "DN")
                ?.getSubTreeByPath("value")
                .getValueAsString(),
            ANR: item.practitioner.children
                .filter((child: SubTree) => child.lastPathElement.includes("identifier"))
                .find((subTree: SubTree) => subTree.getSubTreeByPath("type.coding.code").getValueAsString() === "LANR")
                ?.getSubTreeByPath("value")
                .getValueAsString(),
            author: isAuthor,
        } as IPractitionerObject);
    });

    return returnArray;
};

const orgIdentifierCodings = {
    BSNR: {
        coding: {
            system: "http://terminology.hl7.org/CodeSystem/v2-0203",
            version: "4.0.1",
            code: "BSNR",
            display: "Primary physician office number",
        },
        system: "https://fhir.kbv.de/NamingSystem/KBV_NS_Base_BSNR",
    },
    "IK-Nummer": {
        coding: {
            system: "http://terminology.hl7.org/CodeSystem/v2-0203",
            version: "4.0.1",
            code: "XX",
            display: "Organisations-ID",
        },
        system: "http://fhir.de/sid/arge-ik/iknr",
    },
    KZVA: {
        coding: {
            system: "http://fhir.de/CodeSystem/identifier-type-de-basis",
            version: "4.0.1",
            code: "KZVA",
            display: "KZVAbrechnungsnummer",
        },
        system: "http://fhir.de/sid/kzbv/kzvabrechnungsnummer",
    },
    PRN: {
        coding: {
            system: "http://terminology.hl7.org/CodeSystem/v2-0203",
            version: "4.0.1",
            code: "PRN",
            display: "Provider number",
        },
        system: "https://gematik.de/fhir/sid/telematik-id",
    },
};

/**
 * Helper function to retrieve the key of the property holding the code
 * @param {string} codeToFind Code to find
 * @returns {string | undefined} Key of the property holding the code or undefined
 */
const findKeyByCode = (codeToFind: string): string | undefined => {
    for (const key in orgIdentifierCodings) {
        if (
            orgIdentifierCodings[key.toString()].coding &&
            orgIdentifierCodings[key.toString()].coding.code === codeToFind
        ) {
            return key;
        }
    }
    return undefined;
};

/**
 * Writes the identifier array of an organization to the subTree.
 * @param {SubTree} subTree SubTree to write the identifiers to
 * @param {IOrganizationObject} organization Organization interface holding the identifiers
 */
const setIdentifiersForOrganization = (subTree: SubTree, organization: IOrganizationObject): void => {
    if (organization.identifier && organization.identifier.length > 0) {
        let index: number = 0;
        organization.identifier.forEach((identifier: IOrganizationIdentifierObject): void => {
            if (identifier.value !== "") {
                subTree.setValue(`identifier[${index}].use`, new CodePIO("official"));
                subTree.setValue(
                    `identifier[${index}].system`,
                    new UriPIO(orgIdentifierCodings[identifier.label].system)
                );
                subTree.setValue(`identifier[${index}].value`, new StringPIO(identifier.value));
                writeCodingToSubTree(
                    subTree,
                    `identifier[${index}].type.coding`,
                    orgIdentifierCodings[identifier.label].coding
                );
                index++;
            }
        });
    }
};

/**
 * Converts identifier subTrees into an IOrganizationIdentifierObject array.
 * @param {SubTree} subTree SubTree that holds the respective identifiers as children
 * @returns {IOrganizationIdentifierObject[]} IOrganizationIdentifierObject array
 */
const getIdentifiersForOrganization = (subTree: SubTree): IOrganizationIdentifierObject[] => {
    const array: IOrganizationIdentifierObject[] = [];
    const identifierSubTree: SubTree = subTree.getSubTreeByPath("identifier");
    identifierSubTree.children.forEach((child: SubTree): void => {
        const label: string | undefined = findKeyByCode(
            child.getSubTreeByPath("type.coding.code").getValueAsString() as string
        );
        array.push({ label: label ?? "", value: child.getSubTreeByPath("value").getValueAsString() as string });
    });
    return array;
};

/**
 * Converts an array of IOrganizationObject interfaces to an array of subTrees pointing to
 * "uuid.KBV_PR_MIO_ULB_Organization". The id key of the interface will get the uuid for the contact
 * person resource.
 * @param {IOrganizationObject[]} organizations Organization interfaces for conversation
 * @returns {SubTree[]} A subTree array holding all contact persons
 */
export const convertToOrganizationSubTrees = (organizations: IOrganizationObject[]): SubTree[] => {
    const organizationTypeValueSet: ValueSets = new ValueSets(
        "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Type_Of_Facility"
    );
    const array: SubTree[] = [];
    organizations.forEach((organization: IOrganizationObject): void => {
        const subTree: SubTree = new SubTree(organization.id + ".KBV_PR_MIO_ULB_Organization", undefined);

        setValueIfExists("name", StringPIO.parseFromString(organization.name), subTree);
        setIdentifiersForOrganization(subTree, organization);
        if (organization.address)
            subTree.children.push(...convertToAddressSubTrees(organization.address, subTree.absolutePath));
        if (organization.telecom)
            subTree.children.push(...convertToTelecomSubTrees(organization.telecom, subTree.absolutePath));
        if (organization.type)
            writeCodingToSubTree(
                subTree,
                "type.coding",
                organizationTypeValueSet.getObjectByCodeSync(organization.type)
            );
        array.push(subTree);
    });

    return array;
};

/**
 * Converts an contactPerson subTree array to an array of IOrganizationObject interfaces.
 * @param {SubTree[]} subTrees Input which should be converted to IOrganizationObject interfaces. SubTrees should hold
 * following absolute path: "uuid.KBV_PR_MIO_ULB_Organization"
 * @returns {IContactPersonObject[]} IOrganizationObject interfaces as array
 */
export const convertToOrganizationInterface = (subTrees: SubTree[]): IOrganizationObject[] => {
    const array: IOrganizationObject[] = [];
    subTrees.forEach((subTree: SubTree): void => {
        array.push({
            id: subTree.absolutePath.split(".")[0],
            name: subTree.getSubTreeByPath("name[0]").getValueAsString(),
            type: checkCoding(
                subTree,
                "type.coding",
                new ValueSets("https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Type_Of_Facility").getOptionsSync
            ),
            identifier: getIdentifiersForOrganization(subTree),
            address: convertToAddressInterfaces(
                subTree.children.filter((child: SubTree) => child.lastPathElement.includes("address"))
            ),
            telecom: convertToTelecomInterfaces(
                subTree.children.filter((child: SubTree) => child.lastPathElement.includes("telecom"))
            ),
        } as IOrganizationObject);
    });
    return array;
};
