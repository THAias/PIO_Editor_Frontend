import {
    IAddressObject,
    IOrganizationIdentifierObject,
    IOrganizationObject,
    IResponse,
    ITelecomObject,
    SubTree,
} from "@thaias/pio_editor_meta";
import { SelectOption, SelectOptions } from "@thaias/pio_fhir_resources";
import { Form } from "antd";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import { AppDispatch, RootState } from "../../../@types/ReduxTypes";
import organizationActions from "../../../redux/actions/OrganizationActions";
import AddressBookService from "../../../services/AddressBookService";
import { helperTextOrganizationForm } from "../../../services/HelperTextService";
import PIOService from "../../../services/PIOService";
import {
    convertToOrganizationInterface,
    convertToOrganizationSubTrees,
} from "../../../services/SubTreeConverterService";
import UUIDService from "../../../services/UUIDService";
import CustomModal from "../../basic/CustomModal";
import InputDropDown from "../../basic/InputDropDown";
import OrganizationWrapper from "../../wrappers/OrganizationWrapper";

/**
 * This form contains information an organization (both sending or receiving):
 * - KBV_PR_MIO_ULB_Composition.extension:empfangendeEinrichtung -> extension.valueReference.reference
 * - KBV_PR_MIO_ULB_Organization
 * - KBV_PR_MIO_ULB_Organization.extension -> ergaenzende_Angaben
 * - KBV_PR_MIO_ULB_Organization.identifier
 *   -> Insitutionskennzeichen, Betriebsstaettennummer, KZV-Abrechnungsnummer, Telematik-ID
 * - KBV_PR_MIO_ULB_Organization.type -> coding + text
 * - KBV_PR_MIO_ULB_Organization.name
 * - KBV_PR_MIO_ULB_Organization.telecom
 * - KBV_PR_MIO_ULB_Organization.address
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const OrganizationForm = (props: IFormProps): React.JSX.Element => {
    const organizationReduxState: IOrganizationObject[] = useSelector((state: RootState) => state.organizationState);

    const organizationOptions: SelectOptions = [
        { label: "Neue Einrichtung hinzufügen", value: "newOrganization" },
        ...organizationReduxState.map((org: IOrganizationObject): SelectOption => ({ label: org.name, value: org.id })),
    ];

    // UUIDs and Paths
    const organizationPath: string = "KBV_PR_MIO_ULB_Organization";

    // States and watchers
    const [currentOrgUUID, setCurrentOrgUUID] = useState<string | undefined>();
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const form = props.form;
    const organizationNameSelector = Form.useWatch("nameSelected", form);

    const dispatch: AppDispatch = useDispatch();

    const setOrganization = (organizationUUID: string): void => {
        let orgExists: boolean = false;
        organizationReduxState.forEach((organization: IOrganizationObject): void => {
            if (organization.id === organizationUUID) {
                orgExists = true;
                form.setFieldsValue(organization);
                form.setFieldValue("nameSelected", organization.name);
                setCurrentOrgUUID(organizationUUID);
            }
        });
        if (!orgExists)
            PIOService.getSubTrees([`${organizationUUID}.${organizationPath}`]).then((res: IResponse): void => {
                if (!res.success || !res.data) return;
                const organizationObject: IOrganizationObject = convertToOrganizationInterface([
                    (res.data?.subTrees as SubTree[])[0],
                ])[0];
                form.setFieldsValue(organizationObject);
                form.setFieldValue("nameSelected", organizationObject.name);
            });
    };

    useEffect((): void => {
        if (props.sending) {
            PIOService.getAllAuthorUuids().then((result: IResponse): void => {
                if (result.success && result.data) {
                    //Find last author uuid referring to an organization resource
                    const allOrgaUuids: string[] = UUIDService.getUUIDs("KBV_PR_MIO_ULB_Organization") ?? [];
                    const lastUuid: string | undefined = (result.data.uuids as string[])
                        ?.reverse()
                        .find((authorUuid: string) => allOrgaUuids.includes(authorUuid));
                    if (lastUuid) setOrganization(lastUuid);
                }
            });
        } else {
            PIOService.getReceivingInstitution().then((result: IResponse): void => {
                if (result.success && result.data) setOrganization(result.data.uuid as string);
            });
        }
    }, []);

    /**
     * Save new Organization if the modal is closed
     * @param {IOrganizationObject} values The organization values from the modal
     */
    const saveNewOrganization = (values: IOrganizationObject): void => {
        setModalOpen(false);
        AddressBookService.addAddressBookItem(values).then((result: IResponse): void => {
            if (result.success) {
                dispatch(organizationActions.addOrganizationRedux(values));
                form.setFieldValue("nameSelected", values.id);
            }
        });
    };

    /** Initialize organization options based on entries in redux. */
    useEffect((): void => {
        if (organizationNameSelector === "newOrganization") setModalOpen(true);
        else {
            const organization: IOrganizationObject | undefined = organizationReduxState?.find(
                (org: IOrganizationObject): boolean => org.id === organizationNameSelector
            );
            if (organization) {
                form.setFieldsValue(organization);
            }
        }
    }, [organizationNameSelector]);

    /**
     * Stores data from the form to the SubTree state and is triggered on every onBlur
     * @param {IFormFinishObject} values Object which holds the form data
     */
    const onFinish = async (values: IFormFinishObject): Promise<void> => {
        const organization: IOrganizationObject = {
            id: values.id as string,
            address: values.address as IAddressObject[],
            identifier: values.identifier
                ? (values.identifier as IOrganizationIdentifierObject[]).filter(
                      (identifier: IOrganizationIdentifierObject) => {
                          return identifier.value !== "";
                      }
                  )
                : undefined,
            name: values.name as string,
            telecom: values.telecom as ITelecomObject[],
            type: values.type as string,
        };
        const orgSubTree: SubTree = convertToOrganizationSubTrees([organization])[0];

        const reduxOrganizationSet: Set<string> = new Set(
            organizationReduxState?.map((org: IOrganizationObject) => org.name)
        );
        // Update organization in Redux state if it already exists
        if (organizationNameSelector !== "newOrganization" && reduxOrganizationSet.has(organizationNameSelector)) {
            dispatch(organizationActions.updateOrganizationRedux(organization));
        }
        // Check if an organization was chosen and set fields accordingly
        if (organization.id) {
            if (props.sending)
                PIOService.addAuthor(organization.id).then((): void => setCurrentOrgUUID(organization.id));
            else
                PIOService.setReceivingInstitution(organization.id).then((): void =>
                    setCurrentOrgUUID(organization.id)
                );
        } else {
            if (props.sending) {
                setCurrentOrgUUID(undefined);
                await PIOService.deleteAuthor(currentOrgUUID as string);
            } else PIOService.clearReceivingInstitution().then((): void => setCurrentOrgUUID(undefined));
        }
        PIOService.saveSubTrees([orgSubTree]).then((result: IResponse): void => {
            if (!result.success) console.error(result);
        });
    };

    return (
        <div onBlur={form.submit}>
            <Form
                layout={"vertical"}
                form={form}
                onFinish={onFinish}
                name={props.sending ? "SendingOrganizationForm" : "ReceivingOrganizationForm"}
            >
                <div className={"form-line"}>
                    <InputDropDown
                        name={"nameSelected"}
                        label={"Einrichtung auswählen"}
                        placeholder={"Einrichtung wählen"}
                        options={organizationOptions}
                        helpText={helperTextOrganizationForm.nameSelected}
                    />
                </div>
                {organizationNameSelector && !modalOpen && <OrganizationWrapper />}
                {modalOpen && (
                    <CustomModal<IOrganizationObject>
                        label={"Neue Einrichtung hinzufügen"}
                        content={<OrganizationWrapper />}
                        open={modalOpen}
                        onOK={saveNewOrganization}
                        onCancel={(): void => {
                            setModalOpen(false);
                            form.setFieldValue("nameSelected", undefined);
                        }}
                    />
                )}
            </Form>
        </div>
    );
};

export default OrganizationForm;
