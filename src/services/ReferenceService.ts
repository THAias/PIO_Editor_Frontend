import { IResponse, SubTree } from "@thaias/pio_editor_meta";

import PIOService from "./PIOService";
import UUIDService from "./UUIDService";

/**
 * Removes the prefix 'urn:uuid:' from the given UUID string.
 * @param {string | undefined} uuid - The UUID string with possible 'urn:uuid:' prefix.
 * @returns {string | undefined} - The UUID string without 'urn:uuid:' prefix.
 */
const deleteUuidPrefix = (uuid: string | undefined): string | undefined => {
    if (!uuid) return;
    return uuid.replace("urn:uuid:", "");
};

/**
 * Retrieves the ID of the receiving organization.
 * @async
 * @returns {Promise<string | undefined>} A Promise that resolves to the ID of the receiving organization, or undefined if the operation fails.
 */
const getReceivingOrgaId = async (): Promise<string | undefined> => {
    const receivingResult: IResponse = await PIOService.getReceivingInstitution();
    if (!receivingResult.success || !receivingResult.data?.uuid) return;
    return deleteUuidPrefix(receivingResult.data.uuid as string);
};

/**
 * Retrieves the organization ID of the current encounter location.
 * @async
 * @returns {Promise<string|undefined>} The organization ID, or undefined if it cannot be found.
 */
const getEncounterLocationOrgaId = async (): Promise<string | undefined> => {
    const encounterLocationOrganizationId: string | undefined = UUIDService.getUUID(
        "KBV_PR_MIO_ULB_Encounter_Current_Location"
    );
    const encounterLocationOrganizationPath: string | undefined = encounterLocationOrganizationId
        ? encounterLocationOrganizationId + ".KBV_PR_MIO_ULB_Encounter_Current_Location"
        : undefined;
    const encounterLocationOrganizationResult: IResponse | undefined = encounterLocationOrganizationPath
        ? await PIOService.getSubTrees([encounterLocationOrganizationPath])
        : undefined;

    if (!encounterLocationOrganizationResult?.success || !encounterLocationOrganizationResult?.data?.subTrees) return;

    return deleteUuidPrefix(
        encounterLocationOrganizationResult.data.subTrees[0]
            .getSubTreeByPath("serviceProvider.reference")
            .getValueAsString()
    );
};

/**
 * Retrieves the organization IDs associated with practitioner roles.
 * @async
 * @returns {Promise<string[] | undefined>} - An array of organization IDs, or undefined if there are no practitioner roles.
 */
const getPractitionerOrgaIds = async (): Promise<string[] | undefined> => {
    const practitionerOrganizationIds: string[] = [];
    const practitionerRolePaths: string[] | undefined = UUIDService.getUUIDs("KBV_PR_MIO_ULB_PractitionerRole")?.map(
        (practitionerRoleUuids: string) => practitionerRoleUuids + ".KBV_PR_MIO_ULB_PractitionerRole"
    );
    if (practitionerRolePaths) {
        const practitionerRoleResults: IResponse = await PIOService.getSubTrees(practitionerRolePaths);
        const practitionerRoleSubTrees: SubTree[] | undefined = practitionerRoleResults.success
            ? (practitionerRoleResults.data?.subTrees as SubTree[])
            : undefined;
        const organizationIds: (string | undefined)[] | undefined = practitionerRoleSubTrees?.map(
            (practitionerRoleSubTree: SubTree) =>
                practitionerRoleSubTree.getSubTreeByPath("organization.reference").getValueAsString()
        );
        organizationIds?.forEach((organizationId: string | undefined) => {
            if (organizationId && !practitionerOrganizationIds.includes(organizationId)) {
                const cleanedOrganizationId: string | undefined = deleteUuidPrefix(organizationId);
                if (cleanedOrganizationId) practitionerOrganizationIds.push(cleanedOrganizationId);
            }
        });
    }
    return practitionerOrganizationIds && practitionerOrganizationIds.length > 0
        ? practitionerOrganizationIds
        : undefined;
};

/**
 * Retrieves an array of organization ids associated with devices.
 * @async
 * @returns {Promise<string[] | undefined>} An array of organization ids, or undefined if no ids are found.
 */
const getDeviceOrgaIds = async (): Promise<string[] | undefined> => {
    const devicePaths: string[] | undefined = UUIDService.getUUIDs("KBV_PR_MIO_ULB_Device")?.map(
        (uuid) => `${uuid}.KBV_PR_MIO_ULB_Device`
    );
    if (!devicePaths) return;

    const deviceResults: IResponse = await PIOService.getSubTrees(devicePaths);
    if (!deviceResults.success || !deviceResults.data?.subTrees) return;

    const deviceOrganizationIds: string[] = [];

    //Helper for extracting the organization reference uuid from each device subTree
    const extractOrganizationId = (subTree: SubTree | undefined): void => {
        if (!subTree) return;

        const organizationId: string | undefined = subTree
            .getSubTreeByPath("extension[0].valueReference.reference")
            .getValueAsString();

        if (organizationId && !deviceOrganizationIds.includes(organizationId)) {
            const cleanedOrganizationId: string | undefined = deleteUuidPrefix(organizationId);
            if (cleanedOrganizationId) deviceOrganizationIds.push(cleanedOrganizationId);
        }
    };

    const deviceSubTrees: SubTree[] | undefined = deviceResults.data?.subTrees as SubTree[];
    deviceSubTrees?.forEach(extractOrganizationId);

    return deviceOrganizationIds.length > 0 ? deviceOrganizationIds : undefined;
};

/**
 * Retrieves the sending organization IDs.
 * If successful, returns an array of string IDs.
 * If no IDs are found or an error occurs, returns undefined.
 * @async
 * @returns {Promise<string[] | undefined>} An array of string IDs or undefined.
 */
const getSendingOrgaIds = async (): Promise<string[] | undefined> => {
    const allPractitionerIds: string[] | undefined = UUIDService.getUUIDs("KBV_PR_MIO_ULB_Practitioner");
    const allAuthorIdsResponse: IResponse = await PIOService.getAllAuthorUuids();
    // return undefined if no author uuids are found
    if (!allAuthorIdsResponse.success || !allAuthorIdsResponse.data?.uuids) return undefined;
    const allAuthorIds: string[] = allAuthorIdsResponse.data?.uuids as string[];
    const allOrgaAuthorIds: string[] = allAuthorIds.filter(
        (authorId: string) => !allPractitionerIds?.includes(authorId)
    );
    return allOrgaAuthorIds && allOrgaAuthorIds.length > 0 ? allOrgaAuthorIds : undefined;
};

/**
 * Retrieves all referenced organization UUIDs.
 * @async
 * @returns {Promise<string[] | undefined>} A promise that resolves with an array of organization UUIDs or undefined.
 */
export const getAllReferencedOrganUUIDs = async (): Promise<string[] | undefined> => {
    const [
        receivingOrganizationId,
        encounterLocationOrgaId,
        practitionerOrgaIds,
        deviceOrgaIds,
        sendingOrganizationIds,
    ]: Awaited<
        [
            receivingOrganizationId: string | undefined,
            encounterLocationOrgaId: string | undefined,
            practitionerOrgaIds: string[] | undefined,
            deviceOrgaIds: string[] | undefined,
            sendingOrganizationId: string[] | undefined,
        ]
    > = await Promise.all([
        getReceivingOrgaId(),
        getEncounterLocationOrgaId(),
        getPractitionerOrgaIds(),
        getDeviceOrgaIds(),
        getSendingOrgaIds(),
    ]);

    // Concatenate all organization ids and delete out all duplicates
    const allReferencedOrgaIds: string[] = [
        ...new Set([
            ...(receivingOrganizationId ? [receivingOrganizationId] : []),
            ...(encounterLocationOrgaId ? [encounterLocationOrgaId] : []),
            ...(practitionerOrgaIds ? practitionerOrgaIds : []),
            ...(deviceOrgaIds ? deviceOrgaIds : []),
            ...(sendingOrganizationIds ? sendingOrganizationIds : []),
        ]),
    ];
    return allReferencedOrgaIds && allReferencedOrgaIds.length > 0 ? allReferencedOrgaIds : undefined;
};
