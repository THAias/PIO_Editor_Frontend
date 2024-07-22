import { IPractitionerObject, IResponse, SubTree } from "@thaias/pio_editor_meta";

import { IReduxAction } from "../../@types/ReduxTypes";
import PIOService from "../../services/PIOService";
import { convertToPractitionerSubTrees } from "../../services/SubTreeConverterService";
import UUIDService from "../../services/UUIDService";

/**
 * Extra function to reduce cognitive complexity of the practitioner reducer.
 * @param {IReduxAction} action Action from practitioner reducer
 */
const removePractitionerFromBackendAndUUIDService = (action: IReduxAction = {} as IReduxAction) => {
    //Get uuids of all matching practitionerRole resources. If present, delete from backend and UUIDService.
    const practitionerRolePaths: string[] | undefined = UUIDService.getUUIDs("KBV_PR_MIO_ULB_PractitionerRole")?.map(
        (item: string) => item + ".KBV_PR_MIO_ULB_PractitionerRole"
    );
    if (practitionerRolePaths) {
        PIOService.getSubTrees(practitionerRolePaths).then((result: IResponse) => {
            if (result.success) {
                const roleUuid: string[] = (result.data?.subTrees as SubTree[])
                    .filter((subTree: SubTree) => {
                        return (
                            subTree.getSubTreeByPath("practitioner.reference").getValue()?.get() === action.payload.id
                        );
                    })
                    .map((subTree: SubTree): string => subTree.absolutePath.split(".")[0]);
                if (roleUuid.length > 0) {
                    PIOService.deleteSubTrees(
                        roleUuid.map((uuid: string): SubTree => new SubTree(uuid, undefined))
                    ).then((result1: IResponse) => {
                        if (!result1.success) console.error(result1);
                    });
                    UUIDService.deleteUUIDs(roleUuid);
                }
            }
        });
    }

    //Delete practitioner from backend and UUIDService
    PIOService.deleteSubTrees([new SubTree(action.payload.id, undefined)]).then((result: IResponse) =>
        console.debug(result)
    );
    UUIDService.deleteUUIDs([action.payload.id]);
};

/**
 * Extra function to reduce cognitive complexity of the practitioner reducer.
 * @param {IPractitionerObject} practitioner Array of practitioner interfaces
 */
const updatePractitionerInBackend = (practitioner: IPractitionerObject[]) => {
    const practitionerRoleUuids: string[] = UUIDService.getUUIDs("KBV_PR_MIO_ULB_PractitionerRole") ?? [];
    const practitionerRolePaths: string[] =
        practitionerRoleUuids.map((item: string) => item + ".KBV_PR_MIO_ULB_PractitionerRole") ?? [];
    PIOService.getSubTrees(practitionerRolePaths).then((result: IResponse): void => {
        if (result.success) {
            convertToPractitionerSubTrees(practitioner, result.data?.subTrees as SubTree[]).then(
                (subTrees: { practitioner: SubTree[]; practitionerRole: SubTree[] }) => {
                    PIOService.saveSubTrees([...subTrees.practitioner, ...subTrees.practitionerRole]).then(
                        (result1: IResponse) => {
                            if (result1.success) {
                                //Write new uuids to UUIDService
                                const newPractitionerRoleUuids: string[] = subTrees.practitionerRole.map(
                                    (subTree: SubTree): string => subTree.absolutePath.split(".")[0] ?? []
                                );
                                newPractitionerRoleUuids.forEach((newUuid: string) => {
                                    if (!practitionerRoleUuids.includes(newUuid))
                                        UUIDService.setUUID(newUuid, "KBV_PR_MIO_ULB_PractitionerRole");
                                });
                            }
                        }
                    );
                }
            );
        }
    });
};

/**
 * Reducer for practitioner
 * @param {IPractitionerObject[]} state The current state
 * @param {IReduxAction} action The action to perform
 * @returns {IPractitionerObject[]} The new state
 */
export const practitionerReducer = (
    state: IPractitionerObject[] = [],
    action: IReduxAction = {} as IReduxAction
): IPractitionerObject[] => {
    switch (action.type) {
        case "ADD_PRACTITIONER":
            if (action.payload.practitioner) {
                convertToPractitionerSubTrees([action.payload.practitioner] as IPractitionerObject[], undefined).then(
                    (subTrees: { practitioner: SubTree[]; practitionerRole: SubTree[] }) => {
                        PIOService.saveSubTrees([...subTrees.practitioner, ...subTrees.practitionerRole]).then(
                            (result: IResponse) => {
                                if (!result.success) console.error(result.message);
                            }
                        );
                        UUIDService.setUUID(action.payload.practitioner.id, "KBV_PR_MIO_ULB_Practitioner");
                        UUIDService.setUUID(
                            subTrees.practitionerRole[0].absolutePath.split(".")[0],
                            "KBV_PR_MIO_ULB_PractitionerRole"
                        );
                    }
                );
            }
            return [action.payload.practitioner, ...state];
        case "REMOVE_PRACTITIONER":
            //Remove from backend and UUIDService
            removePractitionerFromBackendAndUUIDService(action);
            //Update redux
            return state.filter((practitioner: IPractitionerObject): boolean => practitioner.id !== action.payload.id);
        case "UPDATE_PRACTITIONER":
            if (action.payload.practitioners)
                updatePractitionerInBackend(action.payload.practitioners as IPractitionerObject[]);
            return action.payload.practitioners;
        case "INITIALIZE_PRACTITIONER":
            //Uuids will be set in UUIDService in initializeRedux.ts file
            return action.payload.practitioners;
        case "CLEAR_PRACTITIONER":
            return [] as IPractitionerObject[];
        case "LOGOUT":
            return [] as IPractitionerObject[];
        case "CLOSE_PIO":
        case "CLEAN_STATE":
        default:
            return state;
    }
};
