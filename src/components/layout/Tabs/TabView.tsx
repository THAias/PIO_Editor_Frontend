import { IOrganizationObject, IResponse, SubTree } from "@thaias/pio_editor_meta";
import { Form, FormInstance, Tabs, TabsProps } from "antd";
import fileDownload from "js-file-download";
import { ValidateErrorEntity } from "rc-field-form/es/interface";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Id } from "react-toastify";

import { IAllFormInstances, IComponents, IRenderTabs, ITab, ITabs } from "../../../@types/FormTypes";
import { IValidatorModalProps } from "../../../@types/FurtherTypes";
import { AppDispatch, RootState } from "../../../@types/ReduxTypes";
import navigationActions from "../../../redux/actions/NavigationActions";
import { initializeReduxSubTrees } from "../../../redux/initializeRedux";
import AddressBookService from "../../../services/AddressBookService";
import PIOService from "../../../services/PIOService";
import { getAllReferencedOrganUUIDs } from "../../../services/ReferenceService";
import { convertToOrganizationSubTrees } from "../../../services/SubTreeConverterService";
import UUIDService from "../../../services/UUIDService";
import "../../../styles/layout/sidebarContent.scss";
import "../../../styles/layout/tabView.scss";
import toastHandler from "../../ToastHandler";
import PatientName from "../HeaderPatientName";
import { GetTabContent } from "./TabContent";
import TabMenu from "./TabMenu";
import TabWrapper from "./TabWrapper";

/**
 * The wrapper component to display all the tab content
 * @param {object} props Props of React Component
 * @param {IValidatorModalProps} props.validatorModalProps Setter & getter for handling validation modal
 * @returns {React.JSX.Element} React element
 */
const TabView = (props: { validatorModalProps: IValidatorModalProps }): React.JSX.Element => {
    const { openPio } = useSelector((state: RootState) => state.navigationState);
    const dispatch: AppDispatch = useDispatch();
    const [activeKey, setActiveKey] = React.useState<string | undefined>(undefined);
    const exportState: boolean = useSelector((state: RootState) => state.navigationState.exportPio);
    const toastId = React.useRef<Id | undefined>(undefined);
    const [renderedTabs, setRenderedTabs] = React.useState<IRenderTabs>({
        TabOrganizationOrSocial: false,
        TabCareInformation: false,
    });
    const [errorBoolean, setErrorBoolean] = React.useState<boolean>(false);
    const [runningExport, setRunningExport] = React.useState<boolean>(false);

    const exportErrorMessage = "Da hat etwas nicht geklappt";

    //Get all form instances
    const formInstances: IAllFormInstances = {
        patientInsuranceForm: Form.useForm(),
        careLevelForm: Form.useForm(),
        patientInfoForm: Form.useForm(),
        patientCommunicationForm: Form.useForm(),
        degreeOfDisabilityForm: Form.useForm(),
        patientLocationForm: Form.useForm(),
        contactPersonForm: Form.useForm(),
        sendingOrganizationForm: Form.useForm(),
        receivingOrganizationForm: Form.useForm(),
        practitionerForm: Form.useForm(),
        infoAboutRelativesForm: Form.useForm(),
        legalCareForm: Form.useForm(),
        devicesAidForm: Form.useForm(),
        implantForm: Form.useForm(),
        uploadDocumentsForm: Form.useForm(),
        barthelForm: Form.useForm(),
        riskForm: Form.useForm(),
        allergyForm: Form.useForm(),
        orientationForm: Form.useForm(),
        strikingBehaviorForm: Form.useForm(),
        deprivationOfLibertyForm: Form.useForm(),
        isolationForm: Form.useForm(),
        vitalBodyForm: Form.useForm(),
        medicalProblemForm: Form.useForm(),
        careProblemForm: Form.useForm(),
        breathForm: Form.useForm(),
        urinaryFecalForm: Form.useForm(),
        foodTypeForm: Form.useForm(),
        painForm: Form.useForm(),
        nursingMeasuresForm: Form.useForm(),
        medicinesInformationForm: Form.useForm(),
        patientWishForm: Form.useForm(),
        consentStatementForm: Form.useForm(),
    };
    const tabContent: ITabs = GetTabContent(formInstances);

    /**
     * Function to export the PIO as XML if no validation error occurs
     */
    const exportPioService = (): void => {
        PIOService.exportPIO().then((result: IResponse): void => {
            if (result.success) {
                const xmlString: string = result.data?.xmlString as string;
                const blob: Blob = new Blob([xmlString], { type: "text/plain" });
                fileDownload(blob, "pio_export.xml");
                toastHandler.updateValidationSuccess(toastId, "PIO erfolgreich exportiert");
                setRunningExport(false);
            } else {
                console.error("Error Code: " + result.errorCode);
                console.error(result.message);
                let toastMessage: string;
                if (result.message.split(": ")[1] === "No patient resource found but this resource is mandatory") {
                    toastMessage = "Export nicht möglich: Der Name des Patienten fehlt";
                } else {
                    toastMessage = exportErrorMessage;
                }
                toastHandler.updateValidationError(toastId, toastMessage);
                setRunningExport(false);
            }
        });
    };

    /**
     * Helper function to validate the components of a tab
     * @param {IComponents} component the component of hte specific tab to validate
     * @param {string} tabName the name of the tab
     * @returns {Promise<boolean>} true if an error occurs
     * @async
     */
    // eslint-disable-next-line sonarjs/cognitive-complexity
    const validatePioComponents = async (component: IComponents, tabName: string): Promise<boolean> => {
        let hasError: boolean = false;
        if (component.formsInstances === undefined) return hasError;
        let missingFormElementCount: number = 0;
        for (const form of component.formsInstances) {
            try {
                await form[0].validateFields();
            } catch (error) {
                hasError = true;
                const errorElement = error as ValidateErrorEntity;
                // switch Tab if error occurs in other focused tab
                if (activeKey !== tabName) setActiveKey(tabName);
                // define toast message
                missingFormElementCount += errorElement.errorFields.length;
                const message: string = `In ${component.title} ${missingFormElementCount > 1 ? "sind" : "ist"} ${missingFormElementCount} Pflichtfeld${missingFormElementCount > 1 ? "er" : ""} nicht ausgefüllt`;

                // scrolls to first element of the component
                if (missingFormElementCount === errorElement.errorFields.length) {
                    form[0].scrollToField(errorElement?.errorFields[0].name, { behavior: "smooth", block: "center" });
                }
                if (toastId.current) {
                    toastHandler.updateValidationError(toastId, message);
                } else {
                    // initialize validation Toast
                    toastId.current = toastHandler.validationError(message);
                }
            }
        }
        return hasError;
    };

    /**
     * Function to delete all unused organizations in the PIO
     * @param {string[] | undefined} currentOrganizationPathsInPio the paths of the current organizations in the PIO
     * @param {string[]} referencedOrgaPaths the paths of the referenced organizations
     * @param {boolean} garbageCollected boolean to indicate whether garbage collection was successful
     * @returns {Promise<boolean>} true if garbage collection was successful
     */
    const deleteUnusedOrgasInPio = async (
        currentOrganizationPathsInPio: string[] | undefined,
        referencedOrgaPaths: string[],
        garbageCollected: boolean
    ): Promise<boolean> => {
        // delete all unused organizations if there are any in the PIO
        if (currentOrganizationPathsInPio) {
            const unusedOrgaResponse: IResponse = await PIOService.getSubTrees(
                currentOrganizationPathsInPio.filter((path: string) => !referencedOrgaPaths.includes(path))
            );
            if (unusedOrgaResponse.success && unusedOrgaResponse.data) {
                const deleteResponse: IResponse = await PIOService.deleteSubTrees(
                    unusedOrgaResponse.data.subTrees as SubTree[]
                );
                if (!deleteResponse.success) garbageCollected = false;
            }
        }
        return garbageCollected;
    };

    /**
     * Function to write all referenced organizations to the PIO
     * @param {string[]} referencedOrgaUUIDs the UUIDs of the referenced organizations
     * @param {boolean} garbageCollected boolean to indicate whether garbage collection was successful
     * @returns {Promise<boolean>} true if garbage collection was successful
     */
    const writeReferencedOrgasToPio = async (
        referencedOrgaUUIDs: string[],
        garbageCollected: boolean
    ): Promise<boolean> => {
        const addressBookItems: IResponse = await AddressBookService.getAllAddressBookItems();
        if (addressBookItems.success && addressBookItems.data) {
            // get only the address book items that are referenced in the PIO
            const referencedOrgaUUIDsInAddressBook: IOrganizationObject[] = referencedOrgaUUIDs.map(
                (referenceUUID: string): IOrganizationObject => {
                    const addressBookItem: IOrganizationObject | undefined = (
                        addressBookItems.data?.items as IOrganizationObject[]
                    ).find((organization: IOrganizationObject): boolean => organization.id === referenceUUID);
                    if (addressBookItem) return addressBookItem;
                    else
                        throw new Error(
                            "Eine im PIO ausgewählte Organisation ist nicht in der Datenbank enthalten (uuid: " +
                                referenceUUID +
                                ")"
                        );
                }
            );

            const referencedOrgaSubTrees: SubTree[] = convertToOrganizationSubTrees(referencedOrgaUUIDsInAddressBook);
            // add all referenced organizations to the PIO
            const addResponse: IResponse = await PIOService.saveSubTrees(referencedOrgaSubTrees);
            if (!addResponse.success) garbageCollected = false;
        }
        return garbageCollected;
    };

    /**
     * Asynchronously scan the PIO for all referenced organizations and add them to the PIO.
     * @async
     * @returns {Promise<boolean>} - A Promise that resolves with a boolean indicating whether garbage collection was successful.
     */
    const writeOrgasToPio = async (): Promise<boolean> => {
        let garbageCollected: boolean = true;
        const referencedOrgaUUIDs: string[] | undefined = await getAllReferencedOrganUUIDs();
        const currentOrgaUUIDs: string[] | undefined = UUIDService.getUUIDs("KBV_PR_MIO_ULB_Organization");
        if (referencedOrgaUUIDs) {
            const currentOrganizationPathsInPio: string[] | undefined = currentOrgaUUIDs?.map(
                (uuid: string): string => `${uuid}.KBV_PR_MIO_ULB_Organization`
            );
            const referencedOrgaPaths: string[] = referencedOrgaUUIDs.map(
                (uuid: string): string => `${uuid}.KBV_PR_MIO_ULB_Organization`
            );

            garbageCollected = await deleteUnusedOrgasInPio(
                currentOrganizationPathsInPio,
                referencedOrgaPaths,
                garbageCollected
            );

            garbageCollected = await writeReferencedOrgasToPio(referencedOrgaUUIDs, garbageCollected);
        }

        return garbageCollected;
    };

    /**
     * Function to validate the whole Pio and iterate through errors
     */
    const validatePio = async (): Promise<void> => {
        let hasError: boolean = false;

        const renderedTabNames: string[] = Object.keys(renderedTabs).filter(
            (key: string): string => renderedTabs[key.toString()]
        );

        for (const tabName of renderedTabNames) {
            if (hasError) break;

            for (const component of Object.values((tabContent[tabName.toString()] as ITab).components)) {
                hasError = await validatePioComponents(component, tabName);
                if (hasError) break;
            }
        }

        setErrorBoolean(hasError);

        if (!hasError) {
            dispatch(navigationActions.exportPioRedux(false));
            if (toastId.current) {
                toastHandler.dismiss(toastId.current);
                toastId.current = undefined;
            }
            try {
                const garbageCollected: boolean = await writeOrgasToPio();
                if (garbageCollected) exportPioService();
            } catch (error) {
                let errorMessage: string = exportErrorMessage;
                if (error instanceof Error) errorMessage = error.message;
                toastHandler.updateValidationError(toastId, errorMessage);
                setRunningExport(false);
            }
        } else {
            setRunningExport(false);
        }
    };

    /**
     * Function to export the PIO as XML
     */
    const exportPioButtonHandler = async (): Promise<void> => {
        setRunningExport(true);
        //Submit all forms
        Object.values(formInstances).forEach((form: [FormInstance]) => {
            if (form) form[0].submit();
        });
        if (!exportState) {
            dispatch(navigationActions.exportPioRedux(true));
        } else {
            setErrorBoolean(false);
        }
    };

    useEffect((): void => {
        if (exportState || errorBoolean) setTimeout(() => validatePio(), 100);
    }, [exportState, errorBoolean]);

    useEffect((): void => {
        if (!exportState && toastId.current) {
            toastId.current = undefined;
        }
    }, [exportState]);

    useEffect(() => {
        initializeReduxSubTrees().catch((error: Error) => console.error(error));
    }, []);

    /**
     * Helper function to transform the tab names from the props to TabProps["Items"]
     * @returns {TabsProps["items"]} the transformed tab names
     */
    const items: TabsProps["items"] = Object.entries(tabContent).map(([key, content]: [string, ITab]) => ({
        key: key,
        label: content.tabTitle,
        forceRender: false,
        children: <TabWrapper components={content.components} setRenderedTabs={setRenderedTabs} tabName={key} />,
    }));

    return (
        openPio && (
            <>
                <PatientName />
                <div className={"tab-wrapper"}>
                    <Tabs
                        className={"tab-view"}
                        onTabClick={(key: string): void => {
                            const baseUrl: string = window.location.origin;
                            if (process.env.REACT_APP_VERSION_ENV == "webVersion") {
                                window.history.replaceState(null, "", baseUrl + "/editor");
                            } else {
                                window.history.replaceState(null, "", baseUrl);
                            }
                            setActiveKey(key);
                        }}
                        activeKey={activeKey}
                        size={"large"}
                        type="card"
                        style={{ background: "transparent" }}
                        items={items}
                        tabBarExtraContent={TabMenu(exportPioButtonHandler, props.validatorModalProps, runningExport)}
                        destroyInactiveTabPane={false}
                    />
                </div>
            </>
        )
    );
};

export default TabView;
