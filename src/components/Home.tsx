import { IResponse, IUserData, UuidPIO } from "@thaias/pio_editor_meta";
import { Button, Card, Divider, Popconfirm, Spin, Upload } from "antd";
import { RcFile, UploadChangeParam } from "antd/es/upload";
import axios from "axios";
import { UploadRequestOption } from "rc-upload/es/interface";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { IValidatorModalProps } from "../@types/FurtherTypes";
import { AppDispatch, INavigationProps, IReduxAction, RootState } from "../@types/ReduxTypes";
import examplePio from "../assets/beispiel-pio.xml";
import navigationActions from "../redux/actions/NavigationActions";
import validatorActions from "../redux/actions/ValidatorActions";
import { addAuthorToExistingPio, writeNewAuthorResourceAndReference } from "../services/AuthorService";
import PIOService from "../services/PIOService";
import "../styles/home.scss";
import toastHandler from "./ToastHandler";

/**
 * Home screen of pio-editor.
 * @param {object} props Props of React Component
 * @param {IValidatorModalProps} props.validatorModalProps Setter & getter for handling validation modal
 * @returns {React.JSX.Element} React element
 */
const Home = (props: { validatorModalProps: IValidatorModalProps }): React.JSX.Element => {
    //State for storing the content of a xml-file and its name, which might be uploaded by the user
    const userData: IUserData | undefined = useSelector((state: RootState) => state.authState.userData);
    const [xmlString, setXmlString] = useState<string | undefined>(undefined);
    const [fileUploaded, setFileUploaded] = useState<boolean>(false);
    const [uploadFileDialogVisible, setUploadFileDialogVisible] = useState<boolean>(false);
    const [uploadPopoverVisible, setUploadPopoverVisible] = useState<boolean>(false);
    const { openPio }: INavigationProps = useSelector((state: RootState) => state.navigationState);
    const uploadButtonRef: React.RefObject<HTMLButtonElement> = React.createRef();
    const dispatch: AppDispatch = useDispatch();
    const [uploadLoadingStateDemo, setUploadLoadingStateDemo] = useState<boolean>(false);
    const [uploadLoadingStateFile, setUploadLoadingStateFile] = useState<boolean>(false);

    //Constants
    const popConfirmMessage: string =
        "Es ist bereits ein anderes PIO geöffnet. Alle ungespeicherten Änderungen gehen verloren.";

    // Check if a PIO is already open and request userData
    useEffect((): void => {
        PIOService.isPIOOpen().then(async (result: IResponse): Promise<void> => {
            dispatch(navigationActions.setPioRedux(result.success));
        });
    }, [dispatch]);

    /** OnClick handler for the "generate new pio" button. */
    const generateNewPio = (): void => {
        PIOService.newPIO().then(async (result: IResponse): Promise<void> => {
            if (result.success) {
                toastHandler.success("Neues PIO erfolgreich geöffnet");
                console.debug("New PIO successfully opened");

                //Initialize PIO-ULB-Editor
                dispatch(await navigationActions.openPioAndInitRedux());

                //Add logged-in user as practitioner to pio and reference as author
                writeNewAuthorResourceAndReference(dispatch, userData);

                //Update redux state
                dispatch(navigationActions.setOpenPioType("new"));
            } else {
                toastHandler.error("Es konnte leider kein neues PIO erstellt werden");
                console.error(`Backend error: ${result.message} (error code: ${result.errorCode})`);
            }
        });
    };

    /** Sends the xmlString to the backend and opens the PIO. */
    const handleXML = (): void => {
        if (xmlString == null) return;

        PIOService.openPIO(xmlString).then(async (result: IResponse): Promise<void> => {
            //Start validation process
            props.validatorModalProps.setValidationResult(undefined);
            const newValidationId: string = UuidPIO.generateUuid();
            props.validatorModalProps.setValidationXmlObject({ id: newValidationId, xmlString: xmlString });
            dispatch(validatorActions.setValidationId(newValidationId));

            if (result.success) {
                console.debug("PIO successfully imported");

                //Initialize PIO-ULB-Editor
                dispatch(await navigationActions.openPioAndInitRedux());

                //Add logged-in user as practitioner to pio and reference as author (if not already present)
                addAuthorToExistingPio(dispatch, userData);

                //Request import errors
                PIOService.getReadXmlErrors().then((result1: IResponse) => {
                    if (result1.data && (result1.data.readXmlErrors as []).length) {
                        console.warn("Errors while reading XML:");
                        console.warn(result1.data?.readXmlErrors);
                    }
                });
                PIOService.getPioSmallExclusions().then((result1: IResponse) => {
                    if (result1.data && Object.keys(result1.data.pioSmallExclusions).length > 0) {
                        console.warn("PIO Small Exclusions while reading XML:");
                        console.warn(result1.data?.pioSmallExclusions);
                    }
                });

                //Update redux state and give user feedback
                dispatch(navigationActions.setOpenPioType("imported"));
                toastHandler.success("PIO erfolgreich importiert");
                setUploadLoadingStateDemo(false);
            } else {
                console.error(`Backend error: ${result.message} (error code: ${result.errorCode})`);
                toastHandler.error("Das PIO konnte leider nicht geöffnet werden!");
                setXmlString(undefined);
                setUploadLoadingStateFile(false);
                setUploadLoadingStateDemo(false);
                props.validatorModalProps.setModalOpen(true);
            }
        });
    };

    /** OnClick handler for the "open existing pio" button. */
    const openExistingPio = (): void => {
        const openExistingPioHelper = (): void => {
            if (xmlString) {
                handleXML();
            } else {
                //Warn message (no file uploaded)
                toastHandler.warning("Bitte lade erst ein PIO hoch");
                console.warn("Warning: No file uploaded");
            }
        };

        if (openPio) {
            dispatch(navigationActions.cleanStates());
            PIOService.closePIO().then((): void => {
                openExistingPioHelper();
            });
        } else {
            openExistingPioHelper();
        }
    };

    /**
     * The file will be transformed into a string and stored in the state as promise.
     * If the file is successfully uploaded, the file.status is set to done.
     * @param {UploadRequestOption} options UploadRequestOption
     */
    const extractXmlString = async (options: UploadRequestOption): Promise<void> => {
        const { onSuccess, onError, file, onProgress } = options;

        const reader: FileReader = new FileReader();
        new Promise((resolve, reject): void => {
            reader.onerror = (): void => {
                reader.abort();
                reject(new DOMException("Problem parsing input file."));
            };
            reader.readAsText(file as RcFile);
            reader.onload = (event: ProgressEvent<FileReader>): void => {
                if ((event.target?.result as string) === "") {
                    toastHandler.warning("Die Datei ist leer");
                    setXmlString(undefined);
                    reject("empty file");
                }
                setXmlString(event.target?.result as string);
                console.debug("File successfully opened");
                resolve("done");
            };
            reader.onprogress = (event: ProgressEvent<FileReader>): void => {
                if (onProgress) onProgress({ percent: (event.loaded / event.total) * 100 });
            };
        })
            .then((result): void => {
                if (onSuccess) onSuccess(result);
            })
            .catch((error): void => onError && onError(error));
    };

    const loadExamplePio = (): void => {
        axios.get(examplePio).then((response) => {
            setXmlString(response.data);
            setFileUploaded(true);
            setUploadLoadingStateDemo(true);
        });
    };

    // Open existing PIO if file is uploaded and xmlString is set
    useEffect((): void => {
        if (fileUploaded && xmlString) {
            openExistingPio();
        }
    }, [fileUploaded, xmlString]);

    // Open file upload dialog if popover is accepted
    useEffect((): void => {
        if (uploadFileDialogVisible) {
            uploadButtonRef.current?.click();
        }
    }, [uploadFileDialogVisible]);

    return (
        <div className={"home-screen"}>
            <div className={"home-screen-line"}>
                {openPio && (
                    <Card title={"Zurück zum PIO-ULB"} className={"home-card"} actions={[]}>
                        <div className={"home-card-content"}>
                            <div className={"home-card-text"}>
                                Es ist bereits ein PIO-ULB geöffnet. Klicken Sie hier um das PIO-ULB weiter zu
                                bearbeiten.
                            </div>
                            <Divider dashed />
                            <div className={"home-button-container"}>
                                {
                                    <Button
                                        type={"primary"}
                                        onClick={async (): Promise<IReduxAction> =>
                                            dispatch(await navigationActions.openPioAndInitRedux())
                                        }
                                    >
                                        Zurück zum PIO-ULB
                                    </Button>
                                }
                            </div>
                        </div>
                    </Card>
                )}
                <Card title={"Neues PIO-ULB erstellen"} className={"home-card"}>
                    <div className={"home-card-content"}>
                        <div className={"home-card-text"}>
                            Erstellt ein leeres PIO-ULB-Formular zum Eintragen relevanter Überleitungsdaten. Zum Schluss
                            kann das Formular als standardisierte PIO-ULB-Datei exportiert werden.
                        </div>
                        <Divider dashed />
                        <div className={"home-button-container"}>
                            <Popconfirm
                                title="Warnung"
                                description={popConfirmMessage}
                                disabled={!openPio}
                                onConfirm={(): void => {
                                    dispatch(navigationActions.cleanStates());
                                    PIOService.closePIO().then((): void => {
                                        generateNewPio();
                                    });
                                }}
                                okText="OK"
                                cancelText="Abbrechen"
                            >
                                <Button
                                    type={"primary"}
                                    className={"home-card-button"}
                                    onClick={() => !openPio && generateNewPio()}
                                >
                                    PIO-ULB erstellen
                                </Button>
                            </Popconfirm>
                        </div>
                    </div>
                </Card>
                <Card title={"PIO-ULB aus Datei öffnen"} className={"home-card"}>
                    <div className={"home-card-content"}>
                        <div className={"home-card-text"}>
                            Importiert eine bereits existierende PIO-ULB-Datei auf dem lokalen Computer. Bitte beachte,
                            dass nur Dateien, die mit dem PIO-ULB-Editor erstellt wurden, vollständig eingelesen werden.
                            <br />
                            Oder öffnet ein Demo PIO.
                        </div>

                        <Divider dashed />
                        <div className={"home-button-container open"}>
                            {process.env.REACT_APP_VERSION_ENV === "webVersion" ? (
                                <Popconfirm
                                    title="Warnung"
                                    description={popConfirmMessage}
                                    disabled={!openPio}
                                    onConfirm={(): void => {
                                        dispatch(navigationActions.cleanStates());
                                        PIOService.closePIO().then((): void => {
                                            loadExamplePio();
                                        });
                                    }}
                                    okText="OK"
                                    cancelText="Abbrechen"
                                >
                                    <Button
                                        disabled={uploadLoadingStateFile}
                                        type={"primary"}
                                        className={uploadLoadingStateDemo ? "home-card-button-loading" : ""}
                                        onClick={() => !openPio && loadExamplePio()}
                                    >
                                        {uploadLoadingStateDemo ? <Spin /> : "Demo öffnen"}
                                    </Button>
                                </Popconfirm>
                            ) : undefined}
                            <Popconfirm
                                title="Warnung"
                                description={popConfirmMessage}
                                open={uploadPopoverVisible}
                                onConfirm={() => setUploadFileDialogVisible(true)}
                                onCancel={() => setUploadPopoverVisible(false)}
                                okText="OK"
                                cancelText="Abbrechen"
                            >
                                <Upload
                                    maxCount={1}
                                    accept={".txt, .xml"}
                                    customRequest={extractXmlString}
                                    onChange={(info: UploadChangeParam) => {
                                        if (info.file.status === "done") {
                                            setFileUploaded(true);
                                            setUploadLoadingStateFile(true);
                                        }
                                    }}
                                    showUploadList={false}
                                    openFileDialogOnClick={!openPio || uploadFileDialogVisible}
                                >
                                    <Button
                                        disabled={uploadLoadingStateDemo}
                                        type={"primary"}
                                        className={uploadLoadingStateFile ? "home-card-button-loading" : ""}
                                        onClick={() => openPio && setUploadPopoverVisible(true)}
                                        ref={uploadButtonRef}
                                    >
                                        {uploadLoadingStateFile ? <Spin /> : "PIO-ULB importieren"}
                                    </Button>
                                </Upload>
                            </Popconfirm>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Home;
