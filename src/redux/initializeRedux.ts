import {
    IContactPersonObject,
    IOrganizationObject,
    IPractitionerObject,
    IResponse,
    SubTree,
} from "@thaias/pio_editor_meta";

import { IExtension } from "../@types/ReduxTypes";
import AddressBookService from "../services/AddressBookService";
import PIOService from "../services/PIOService";
import {
    convertToContactPersonInterfaces,
    convertToExtensionInterfaces,
    convertToOrganizationInterface,
    convertToPractitionerInterfaces,
} from "../services/SubTreeConverterService";
import { extensionUrls } from "../services/SubTreeHelperService";
import UUIDService from "../services/UUIDService";
import contactPersonActions from "./actions/ContactPersonActions";
import mockedDataBaseActions from "./actions/MockedDataBaseActions";
import organizationActions from "./actions/OrganizationActions";
import subTreeExtensionActions from "./actions/PatientExtensionActions";
import practitionerActions from "./actions/PractitionerActions";
import { reduxStore } from "./store";

/** Requests the patient extensions (e.g. confession) from backend and writes data to redux. */
const initializePatientExtensions = async (): Promise<void> => {
    const patientExtensionPath: string =
        UUIDService.getUUID("KBV_PR_MIO_ULB_Patient") + ".KBV_PR_MIO_ULB_Patient.extension";
    PIOService.getSubTrees([patientExtensionPath]).then((result: IResponse) => {
        if (result.success) {
            const extInterfaces: IExtension[] = convertToExtensionInterfaces((result.data?.subTrees as SubTree[])[0]);

            //Just use first occurrences of every patient extension due to information reduction of PIOSmall
            const filteredExtInterfaces: IExtension[] = [];
            [
                extensionUrls.konfession_religion,
                extensionUrls.translatorNeeded,
                extensionUrls.notesForCommunication,
            ].forEach((url: string): void => {
                const data: IExtension | undefined = extInterfaces.find(
                    (item: IExtension): boolean => item.url === url
                );
                if (data && url === extensionUrls.translatorNeeded) data.value = data.value.toLowerCase(); // e.g. True -> true
                if (data) filteredExtInterfaces.push(data);
            });

            reduxStore.dispatch(
                subTreeExtensionActions.setPatientExtensionRedux(filteredExtInterfaces, patientExtensionPath)
            );
        }
    });
};

/** Requests all contact persons from backend and writes data to redux. */
const initializeContactPersons = async (): Promise<void> => {
    const contactPersonPaths: string[] | undefined = UUIDService.getUUIDs(
        "KBV_PR_MIO_ULB_RelatedPerson_Contact_Person"
    )?.map((uuid: string): string => uuid + ".KBV_PR_MIO_ULB_RelatedPerson_Contact_Person");
    if (!contactPersonPaths) return;
    PIOService.getSubTrees(contactPersonPaths).then((result: IResponse) => {
        if (!result.success) return;
        const reduxContactPersons: IContactPersonObject[] = reduxStore.getState().contactPersonState;
        const newContactPersons: IContactPersonObject[] = [];
        const contactPersonObjects: IContactPersonObject[] = convertToContactPersonInterfaces(
            result.data?.subTrees as SubTree[]
        );
        contactPersonObjects.forEach((item: IContactPersonObject): void => {
            if (!reduxContactPersons.find((reduxItem: IContactPersonObject): boolean => reduxItem.id === item.id))
                newContactPersons.push(item);
        });
        newContactPersons.forEach((contactPersonObject: IContactPersonObject): void => {
            reduxStore.dispatch(contactPersonActions.addContactPersonRedux(contactPersonObject));
        });
    });
};

/** Requests all practitioner and practitionerRole from backend and writes data to redux. */
const initializePractitioner = async (): Promise<void> => {
    PIOService.getAllAuthorUuids().then((r: IResponse): void => {
        const authorUuids: string[] = r.data?.uuids as string[];

        const practitionerPaths: string[] =
            UUIDService.getUUIDs("KBV_PR_MIO_ULB_Practitioner")?.map(
                (uuid: string): string => uuid + ".KBV_PR_MIO_ULB_Practitioner"
            ) ?? [];
        const rolePaths: string[] =
            UUIDService.getUUIDs("KBV_PR_MIO_ULB_PractitionerRole")?.map(
                (uuid: string): string => uuid + ".KBV_PR_MIO_ULB_PractitionerRole"
            ) ?? [];
        PIOService.getSubTrees([...practitionerPaths, ...rolePaths]).then((result: IResponse): void => {
            if (!result.success) return;
            const practitionerSubTrees: SubTree[] = [];
            const practitionerRoleSubTrees: SubTree[] = [];
            const subTrees: SubTree[] = result.data?.subTrees as SubTree[];

            subTrees.forEach((item: SubTree): void => {
                if (item.absolutePath.split(".")[1] === "KBV_PR_MIO_ULB_Practitioner") {
                    practitionerSubTrees.push(item);
                } else if (item.absolutePath.split(".")[1] === "KBV_PR_MIO_ULB_PractitionerRole") {
                    practitionerRoleSubTrees.push(item);
                }
            });

            try {
                const practitionerInterfaces: IPractitionerObject[] = convertToPractitionerInterfaces(
                    practitionerSubTrees,
                    practitionerRoleSubTrees,
                    authorUuids
                );
                //Set uuids in UUIDService
                practitionerSubTrees.forEach((item: SubTree): void => {
                    UUIDService.setUUID(item.absolutePath.split(".")[0], "KBV_PR_MIO_ULB_Practitioner");
                });
                practitionerRoleSubTrees.forEach((item: SubTree) => {
                    UUIDService.setUUID(item.absolutePath.split(".")[0], "KBV_PR_MIO_ULB_PractitionerRole");
                });
                reduxStore.dispatch(practitionerActions.initializePractitionerRedux(practitionerInterfaces));
            } catch (error) {
                const errorMessage: string = error instanceof Error ? error.message : "Unknown error";
                console.error("Conversion to IPractitionerObjects failed due to: " + errorMessage);
            }
        });
    });
};

export const initializeOrganizations = async (): Promise<void> => {
    const organizationUUIDs: string[] | undefined = UUIDService.getUUIDs("KBV_PR_MIO_ULB_Organization");
    if (!organizationUUIDs) {
        return;
    }
    const organizationPaths: string[] = organizationUUIDs.map(
        (uuid: string): string => `${uuid}.KBV_PR_MIO_ULB_Organization`
    );
    const reduxOrganizations: IOrganizationObject[] = reduxStore.getState().organizationState;
    const reduxOrganizationIds: Set<string> = new Set(reduxOrganizations.map((org: IOrganizationObject) => org.id));

    try {
        if (reduxStore.getState().navigationState.openPio) {
            // Load backend or Pio organizations
            const organizationResult: IResponse = await PIOService.getSubTrees(organizationPaths);
            if (!organizationResult.success || !organizationResult.data?.subTrees) {
                console.error("Error fetching organization items:", organizationResult.message);
                return;
            }

            const backendOrganizationObjects: IOrganizationObject[] = convertToOrganizationInterface(
                organizationResult.data.subTrees as SubTree[]
            );

            const organizationsToAdd: IOrganizationObject[] = backendOrganizationObjects.filter(
                (org: IOrganizationObject) => !reduxOrganizationIds.has(org.id)
            );

            if (organizationsToAdd.length > 0) {
                reduxStore.dispatch(organizationActions.addOrganizationsRedux(organizationsToAdd));
                await AddressBookService.addAddressBookItems(organizationsToAdd);
            }
        } else {
            // check if redux organizations are listed in UUIDService
            reduxOrganizationIds.forEach((id: string): void => {
                if (!organizationUUIDs.includes(id)) {
                    UUIDService.setUUID(id, "KBV_PR_MIO_ULB_Organization");
                }
            });
        }
    } catch (error) {
        // Handle errors appropriately (e.g., log, rethrow, or dispatch an error action)
        console.error("Error in initializeOrganizations:", error);
    }
};

/** Requests all addressBook data from backend and writes data to redux. */
export const initializeAddressBook = async (): Promise<void> => {
    const reduxOrganizations: IOrganizationObject[] = reduxStore.getState().organizationState;

    try {
        const addressBookResult: IResponse = await AddressBookService.getAllAddressBookItems();

        // Check for errors or missing data
        if (!addressBookResult.success || !addressBookResult.data?.items) {
            console.error("Error fetching address book items:", addressBookResult.message);
            return;
        }

        const addressBookOrganizations: IOrganizationObject[] = addressBookResult.data.items as IOrganizationObject[];

        // Use Set to efficiently check if organization is in redux
        const reduxOrganizationIds: Set<string> = new Set(reduxOrganizations.map((org: IOrganizationObject) => org.id));

        // Filter organizations that are not in redux and dispatch only unique organizations
        const organizationsToAdd: IOrganizationObject[] = addressBookOrganizations.filter(
            (org: IOrganizationObject) => !reduxOrganizationIds.has(org.id)
        );

        if (organizationsToAdd.length > 0) {
            reduxStore.dispatch(organizationActions.addOrganizationsRedux(organizationsToAdd));
        }
    } catch (error) {
        console.error("Error initializing address book:", error);
    }
};

/** For "webVersion":Requests example addressBook data from backend and writes data to mocked database in redux. */
export const initialMockedDataBase = async (): Promise<void> => {
    const exampleAddressBookItems: IOrganizationObject[] | undefined = (
        await AddressBookService.getAllAddressBookItems()
    ).data?.items as IOrganizationObject[];
    if (exampleAddressBookItems)
        reduxStore.dispatch(mockedDataBaseActions.addAddressBookItems(exampleAddressBookItems));
    else console.error("Requesting example data from backend for mocked database (= address book) in frontend failed");
};

/**
 * This function initializes the subTreeStates in redux when opening a PIO. This function needs to be called once after
 * calling the "openPIO" or "newPIO" route from PIOService.
 */
export const initializeReduxSubTrees = async (): Promise<void> => {
    await initializePatientExtensions();
    await initializeContactPersons();
    await initializePractitioner();
    await initializeAddressBook();
    await initializeOrganizations();
};
