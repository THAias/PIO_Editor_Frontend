import { IResponse } from "@thaias/pio_editor_meta";
import { Alert, Button, Layout, Modal } from "antd";
import fileDownload from "js-file-download";
import React, { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import { useDispatch, useSelector } from "react-redux";

import packageJson from "../../../package.json";
import { AppDispatch, RootState } from "../../@types/ReduxTypes";
import crlogo from "../../assets/logocr.svg";
import thalogo from "../../assets/logotha.svg";
import ukalogo from "../../assets/logouka.svg";
import stmgplogo from "../../assets/stmgp.svg";
import authentificationActions from "../../redux/actions/AuthenticationActions";
import PIOService from "../../services/PIOService";
import "../../styles/layout/footer.scss";

const { Footer } = Layout;

/**
 * The header button from the upper status bar.
 * @returns {React.JSX.Element} React element
 */
const FooterBar = (): React.JSX.Element => {
    const [aboutUsModalOpen, setAboutUsModalOpen] = useState<boolean>(false);
    const [limitationModalState, setLimitationModalState] = useState<string>(""); // "open-initial", "open-button-click", "closed"
    const [backendVersion, setBackendVersion] = useState<string>("---");

    //Redux
    const dispatch: AppDispatch = useDispatch();
    const disclaimerAcceptedState: boolean = useSelector((state: RootState) => state.authState.disclaimerAccepted);

    /** Initializes the backend version and limitationModalState */
    useEffect((): void => {
        PIOService.getVersion()
            .then((result: IResponse): void => {
                if (result.success) setBackendVersion(result.data?.version as string);
            })
            .catch((error) => console.error(error));
        if (disclaimerAcceptedState) setLimitationModalState("closed");
        else setLimitationModalState("open-initial");
    }, []);

    /** Reopens disclaimer modal when redux state 'disclaimerAccepted' changes to false. */
    useEffect((): void => {
        if (!disclaimerAcceptedState) setLimitationModalState("open-initial");
    }, [disclaimerAcceptedState]);

    /**
     * Returns A banner for the disclaimer in "webVersion".
     * @returns {React.JSX.Element} A react element
     */
    const getAgreementText = (): React.JSX.Element => {
        return (
            <>
                <h2>
                    <b>Einwilligungserklärung</b>
                </h2>
                Bitte geben Sie in den nachfolgenden Fenstern keine personenbezogenen Daten ein! Personenbezogene Daten
                sind solche Informationen, die in einzelner Betrachtung oder einer Gesamtschau den Rückschluss auf eine
                bestimmte Person ermöglichen. Aufgrund der angestrebten Forschungszwecke möchten wir die Erfahrungen mit
                unserem Prototyp anonym erforschen und keine echten personenbezogenen Daten verarbeiten. Sofern sie
                dennoch personenbezogene Daten eingeben, nehmen Sie bitte Folgendes zur Kenntnis: Mit dem Klick auf
                &quot;Akzeptieren&quot; erklären Sie sich einverstanden, dass Ihre personenbezogenen Daten zu
                Testzwecken verarbeitet werden. Ihre Einwilligung können Sie jederzeit und mit Wirkung für die Zukunft
                widerrufen. Weitere Informationen zum Datenschutz können Sie den{" "}
                <a href={"/html/datenschutz.html"} target={"_blank"} rel={"noopener noreferrer"}>
                    Datenschutzhinweisen
                </a>{" "}
                entnehmen.
                <br />
                <br />
                <Alert
                    banner
                    type={"error"}
                    message={
                        <Marquee pauseOnHover gradient={false}>
                            <b>KEINE echten personenbezogenen Daten angeben!</b>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                        </Marquee>
                    }
                />
                <br />
            </>
        );
    };

    return (
        <Footer className={"global-footer"}>
            <div className={"logos"}>
                <div className={"logo"}>
                    <img id={"uka"} src={ukalogo.toString()} alt={"Logo UKA"} />
                </div>
                <div className={"logo"}>
                    <img id={"tha"} src={thalogo.toString()} alt={"Logo THA"} />
                </div>
            </div>
            <div className={"credits-version"}>
                <div className={"credits-link"} onClick={() => setAboutUsModalOpen(true)}>
                    Über uns
                </div>
                <div className={"version"}>Version: {packageJson.version}</div>
            </div>
            <div className={"logos"}>
                <div className={"logo"}>
                    <img id={"cr"} src={crlogo.toString()} alt={"Logo Care Regio"} />
                </div>
                <div className={"logo"}>
                    <img
                        id={"stmgp"}
                        src={stmgplogo.toString()}
                        alt={"Bayerisches Staatsministerium für Gesundheit und Pflege"}
                    />
                </div>
            </div>
            <Modal
                open={aboutUsModalOpen}
                title={"Über uns"}
                width={888}
                destroyOnClose={true}
                onCancel={() => setAboutUsModalOpen(false)}
                footer={null}
            >
                <div className={"modal-content-wrapper"}>
                    <div className={"about-us-top-info"}>
                        <div className={"version-and-licence-info"}>
                            <b>Frontend-Version:</b> {packageJson.version} <br />
                            <b>Backend-Version:</b> {backendVersion} <br />
                            <b>Lizenziert unter:</b> Apache License 2.0
                        </div>
                        <Button
                            type="default"
                            className={"limitations-button"}
                            onClick={() => {
                                setAboutUsModalOpen(false);
                                setLimitationModalState("open-button-click");
                            }}
                        >
                            Disclaimer anzeigen
                        </Button>
                    </div>
                    <br />
                    <div>
                        <div className={"credits-cursive"}>
                            Technische Hochschule für angewandte Wissenschaften Augsburg
                        </div>
                        An der Hochschule 1
                        <br />
                        86161 Augsburg
                        <br />
                        Telefon: +49 (0)821-5586-0
                        <br />
                        Telefax: +49 (0)821-5586-3222
                        <br />
                        info@tha.de
                    </div>
                    <br />
                    <div>
                        <div className={"credits-cursive"}>Institut für Agile Softwareentwicklung</div>
                        Prof. Dr.-Ing. Alexandra Teynor
                        <br />
                        Telefon: +49 821 5586-3459
                        <br />
                        E-Mail: alexandra.teynor@tha.de
                    </div>
                    <br />
                    <div>
                        <div className={"credits-cursive"}>
                            <b>Projekt</b>
                        </div>
                        Verbundforschungsprojekt CARE REGIO <br />
                        Teilprojekt DigiPÜB <br />
                        <br />
                        <div className={"credits-subHeadline"}>
                            <b>Projektleitungen</b>
                        </div>
                        Prof. Dr.-Ing. Alexandra Teynor (Agile Softwareentwicklung) <br />
                        Prof. Dr.-Ing. Claudia Reuter (Prozessanalyse) <br />
                        Prof. Dr.-Ing. Dominik Merli (IT-Security) <br />
                        Andreas Mahler, MBA (UKA, Stabstelle Digitale Vernetzung)
                        <br />
                        <br />
                        <div className={"credits-subHeadline"}>
                            <b>Softwareentwicklung</b>
                        </div>
                        Lukas Kleybolte, M.Sc. <br />
                        Matthias Regner, M.Eng. <br />
                        Viktor Werlitz, M.Sc. <br />
                        Beratung: Prof. Dr. Phillip Heidegger <br />
                        <br />
                        <div className={"credits-subHeadline"}>
                            <b>UI/UX</b>
                        </div>
                        Elisabeth Veronica Mess, M.A. <br />
                        <br />
                        <div className={"credits-subHeadline"}>
                            <b>Product Owner</b>
                        </div>
                        Sabahudin Balic, M.Sc. <br />
                        <br />
                        <div className={"credits-subHeadline"}>
                            <b>IT-Security</b>
                        </div>
                        Andreas Halbritter, B.Sc.
                    </div>
                </div>
            </Modal>
            <Modal
                open={limitationModalState.includes("open")}
                width={888}
                destroyOnClose={true}
                closable={limitationModalState === "open-button-click"}
                maskClosable={limitationModalState === "open-button-click"}
                onCancel={() => setLimitationModalState("closed")}
                footer={null}
            >
                <h2>
                    <b>Disclaimer</b>
                </h2>
                Der PIO-ULB-Editor wurde als <b>Prototyp</b> im Rahmen des Projekts CARE REGIO entwickelt und ermöglicht
                das Importieren, Visualisieren, Editieren und Exportieren von PIOs, die Pflegeüberleitungsberichte
                abbilden. Der PIO-ULB-Editor wurde für folgende Zwecke entwickelt:
                <br />
                <br />
                <ul>
                    <li>
                        Erste Implementierung des PIO-ULB Standards als funktionale Software, um eine beispielhafte,
                        digital gestützte Patientenüberleitung durchzuführen
                    </li>
                    <li>
                        Brückenlösung, solange die Primärsysteme den PIO-ULB Standard nicht flächendeckend unterstützen
                    </li>
                    <li>Diskussionsgrundlage bezüglich der PIO-ULB Inhalte sowie des Bedien- und Interfacekonzepts</li>
                    <li>Unterstützung für Primärsystemhersteller bei der PIO-ULB Implementierung</li>
                </ul>
                Wir weisen ausdrücklich darauf hin, dass der PIO-ULB-Editor nicht für den pflegerischen Alltag
                konzipiert wurde, da keine 100% Datenkonsistenz gewährleistet werden kann. Der Nutzer ist demnach selbst
                für eine ausreichende Kontrolle der Daten verantwortlich.
                <br />
                Beim Import eines PIO-ULBs, welches von anderen Systemen generiert wurde, kommt es aufgrund technischer
                & fachlicher Limitationen zu möglichen Einlesefehlern.
                <br />
                <br />
                Nähere Informationen zu den technischen Limitationen sind in folgenden PDF zu finden:
                <Button
                    type="link"
                    className={"limitations-accept-button"}
                    onClick={() => {
                        PIOService.getLimitationsPDF().then((result: IResponse) => {
                            if (result.success) {
                                const responseData: { type: string; data: Buffer } = result.data?.pdf as {
                                    type: string;
                                    data: Buffer;
                                };
                                const blob: Blob = new Blob([new Uint8Array(responseData.data).buffer], {
                                    type: "application/pdf",
                                });
                                fileDownload(blob, "PIOEditorLimitationen.pdf");
                            }
                        });
                    }}
                >
                    PIOEditorLimitationen.pdf
                </Button>
                <br />
                <br />
                {process.env.REACT_APP_VERSION_ENV === "webVersion" ? getAgreementText() : undefined}
                <br />
                <div className={"limitations-last-row"}>
                    {limitationModalState === "open-initial" ? (
                        <Button
                            type="primary"
                            onClick={(): void => {
                                setLimitationModalState("closed");
                                dispatch(authentificationActions.disclaimerAccepted());
                            }}
                        >
                            Akzeptieren
                        </Button>
                    ) : (
                        <Button
                            type="default"
                            onClick={() => {
                                setLimitationModalState("closed");
                                setAboutUsModalOpen(true);
                            }}
                        >
                            Zurück
                        </Button>
                    )}
                </div>
            </Modal>
        </Footer>
    );
};

export default FooterBar;
