import { IPractitionerObject, IResponse, IUserData, SubTree, UuidPIO, capitalize } from "@thaias/pio_editor_meta";

import { AppDispatch } from "../@types/ReduxTypes";
import practitionerActions from "../redux/actions/PractitionerActions";
import PIOService from "./PIOService";

/**
 * Writes a new practitioner resource with first and last name of logged-in user to pio and refers this resource as
 * author in composition.
 * @param {AppDispatch} dispatch Redux dispatch function
 * @param {IUserData} userData Logged-in user data
 */
export const writeNewAuthorResourceAndReference = (dispatch: AppDispatch, userData?: IUserData): void => {
    const practitionerUuid: string = UuidPIO.generateUuid();
    PIOService.addAuthor(practitionerUuid).then((result: IResponse) => {
        if (result.success) {
            dispatch(
                practitionerActions.addPractitionerRedux({
                    id: practitionerUuid,
                    organization: "",
                    practitionerName: {
                        familyName: capitalize(userData?.lastName as string),
                        givenName: capitalize(userData?.firstName as string),
                    },
                    author: true,
                } as IPractitionerObject)
            );
        }
    });
};

/**
 * Checks whether passed practitioner subTrees represents logged-in user. First and last name will be checked.
 * @param {SubTree[]} practitionerSubTrees All practitioner subTrees which are referenced as author
 * @param {IUserData} userData Logged-in user data
 * @returns {boolean} True, if logged-in user already exists as practitioner resource
 */
const doesAuthorAlreadyExist = (practitionerSubTrees: SubTree[], userData?: IUserData): boolean => {
    let authorAlreadyExists: boolean = false;
    practitionerSubTrees.forEach((subTree: SubTree): void => {
        const lastName: string =
            subTree.getSubTreeByPath("name.family").getValueAsString() ??
            subTree.getSubTreeByPath("name[0].family").getValueAsString() ??
            "";
        const firstName: string =
            subTree.getSubTreeByPath("name.given").getValueAsString() ??
            subTree.getSubTreeByPath("name[0].given").getValueAsString() ??
            "";
        if (
            firstName !== "" &&
            lastName !== "" &&
            capitalize(firstName) === userData?.firstName &&
            capitalize(lastName) === userData?.lastName
        )
            authorAlreadyExists = true;
    });
    return authorAlreadyExists;
};

/**
 * Checks whether a practitioner resource already exists, which matches the first and last name of the logged-in
 * user. If yes, nothing happens, if no, a new practitioner resource is generated and references as author in the
 * composition.
 * @param {AppDispatch} dispatch Redux dispatch function
 * @param {IUserData} userData Logged-in user data
 */
export const addAuthorToExistingPio = (dispatch: AppDispatch, userData?: IUserData): void => {
    PIOService.getAllAuthorUuids().then((result: IResponse): void => {
        //Check whether author already exists
        if (result.success) {
            const paths: string[] = (result.data?.uuids as string[]).map(
                (uuid: string): string => uuid + ".KBV_PR_MIO_ULB_Practitioner"
            );
            PIOService.getSubTrees(paths).then((result1: IResponse) => {
                if (result1.success && !doesAuthorAlreadyExist(result1.data?.subTrees as SubTree[], userData)) {
                    writeNewAuthorResourceAndReference(dispatch, userData);
                }
            });
        }
    });
};
