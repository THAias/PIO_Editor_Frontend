import { IResponse } from "@thaias/pio_editor_meta";
import { v4 as uuid } from "uuid";

import PIOService from "./PIOService";

const UUIDResourceTable: { [uuid: string]: string } = {};

/** Clears the whole UUIDService. */
const clearAllData = (): void => {
    Object.keys(UUIDResourceTable).forEach((key: string): void => {
        delete UUIDResourceTable[key.toString()];
    });
};

/**
 * Gets all UUIDs from backend and saves them in UUIDResourceTable.
 * @returns {Promise} A promise
 */
const getInitialUUIDs = async (): Promise<void> => {
    clearAllData();
    const result: IResponse = await PIOService.getAllUuids();
    if (result.success) {
        Object.entries(result.data?.uuids as object).forEach((entry): void => {
            UUIDResourceTable[entry[0]] = entry[1];
        });
    }
};

/**
 * Gets a UUID for a resource. If the resource is not in the table, a new UUID is generated and returned.
 * @param {string} resource The resource to get a UUID for
 * @returns {string} The UUID from the given resource
 */
const getUUID = (resource: string): string => {
    for (const [key, value] of Object.entries(UUIDResourceTable)) {
        if (value === resource) return key;
    }
    const newUuid: string = uuid().toString();
    UUIDResourceTable[newUuid.toString()] = resource;
    return newUuid;
};

/**
 * Deletes all UUIDs for a resource.
 * @param {string[]} resourceUUIDs The UUIDs to delete
 * @returns {boolean} True if all UUIDs were deleted, false otherwise
 */
const deleteUUIDs = (resourceUUIDs: string[]): boolean => {
    resourceUUIDs.forEach((resourceUUID: string): void => {
        delete UUIDResourceTable[resourceUUID.toString()];
    });
    //check if uuids were deleted
    return resourceUUIDs.every((resourceUUID: string): boolean => {
        return UUIDResourceTable[resourceUUID.toString()] === undefined;
    });
};

/**
 * Gets all UUIDs for a resource. If the resource is not in the table, undefined is returned.
 * @param {string} resource The resource to get UUIDs for
 * @returns {string[] | undefined} An array of UUIDs
 */
const getUUIDs = (resource: string): string[] | undefined => {
    const keys: string[] = [];
    for (const [key, value] of Object.entries(UUIDResourceTable)) {
        if (value === resource) keys.push(key);
    }
    return keys.length > 0 ? keys : undefined;
};

/**
 * Set UUID for a resource and saves it in the UUIDResourceTable.
 * @param {string} givenUuid UUID to set
 * @param {string} resource The resource to generate a UUID for
 */
const setUUID = (givenUuid: string, resource: string): void => {
    UUIDResourceTable[givenUuid.toString()] = resource;
};

/**
 * Gets the resource for a UUID. If the UUID is not in the table, undefined is returned.
 * @param {string} resourceUUID The UUID to get a resource for
 * @returns {string | undefined} The resource for the given UUID or undefined if not existing
 */
const getResourceForUUID = (resourceUUID: string): string | undefined => {
    if (!resourceUUID) return undefined;
    return UUIDResourceTable[resourceUUID.toString()];
};

/**
 * Returns all data the UUIDService holds at the moment.
 * @returns {{ [uuid: string]: string }} Data of UUIDService
 */
const getAllUUIDs = (): { [uuid: string]: string } => {
    return UUIDResourceTable;
};

export default {
    getInitialUUIDs,
    getUUID,
    getResourceForUUID,
    setUUID,
    getUUIDs,
    deleteUUIDs,
    getAllUUIDs,
    clearAllData,
};
