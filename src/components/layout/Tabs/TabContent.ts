import { IResponse } from "@thaias/pio_editor_meta";
import { TranslationListOfExcludedPaths } from "@thaias/pio_fhir_resources";
import React, { useEffect } from "react";

import { IAllFormInstances, IComponents, ITab, ITabs } from "../../../@types/FormTypes";
import PIOService from "../../../services/PIOService";
import AdditionalData from "../../forms/AdditionalData";
import AllergyForm from "../../forms/CareInformation/AllergyForm";
import BarthelForm from "../../forms/CareInformation/BarthelForm";
import BreathForm from "../../forms/CareInformation/BreathForm";
import CareProblemForm from "../../forms/CareInformation/CareProblemForm";
import ConsentStatementForm from "../../forms/CareInformation/ConsentStatementForm";
import DeprivationOfLibertyForm from "../../forms/CareInformation/DeprivationOfLibertyForm";
import FoodTypeForm from "../../forms/CareInformation/FoodTypeForm";
import IsolationForm from "../../forms/CareInformation/IsolationForm";
import MedicalProblemForm from "../../forms/CareInformation/MedicalProblemForm";
import MedicinesInformationForm from "../../forms/CareInformation/MedicinesInformation";
import NursingMeasuresForm from "../../forms/CareInformation/NursingMeasuresForm";
import OrientationForm from "../../forms/CareInformation/OrientationForm";
import PainForm from "../../forms/CareInformation/PainForm";
import PatientWishForm from "../../forms/CareInformation/PatientWishForm";
import RiskForm from "../../forms/CareInformation/RiskForm";
import StrikingBehaviorForm from "../../forms/CareInformation/StrikingBehaviorForm";
import UrinaryFecalForm from "../../forms/CareInformation/UrinaryFecalForm";
import VitalBodyForm from "../../forms/CareInformation/VitalBodyForm";
import CareLevelForm from "../../forms/OrganizationOrSocial/CareLevelForm";
import ContactPersonForm from "../../forms/OrganizationOrSocial/ContactPersonForm";
import DegreeOfDisabilityForm from "../../forms/OrganizationOrSocial/DegreeOfDisabilityForm";
import DevicesAidForm from "../../forms/OrganizationOrSocial/DevicesAidForm";
import ImplantForm from "../../forms/OrganizationOrSocial/ImplantForm";
import InfoAboutRelativesForm from "../../forms/OrganizationOrSocial/InfoAboutRelativesForm";
import LegalCareForm from "../../forms/OrganizationOrSocial/LegalCareForm";
import OrganizationForm from "../../forms/OrganizationOrSocial/OrganizationForm";
import PatientCommunicationForm from "../../forms/OrganizationOrSocial/PatientCommunicationForm";
import PatientInfoForm from "../../forms/OrganizationOrSocial/PatientInfoForm";
import PatientInsuranceForm from "../../forms/OrganizationOrSocial/PatientInsuranceForm";
import PatientLocationForm from "../../forms/OrganizationOrSocial/PatientLocationForm";
import PractitionerForm from "../../forms/OrganizationOrSocial/PractitionerForm";
import UploadDocumentsForm from "../../forms/OrganizationOrSocial/UploadDocumentsForm";

export const GetTabContent = (formInstances: IAllFormInstances): ITabs => {
    const getTitleFromResourceName = (resourceName: string): string => {
        return TranslationListOfExcludedPaths[resourceName.toString()]?.translation;
    };

    const [additionalDataTab, setAdditionalDataTab] = React.useState<ITab>({
        tabTitle: "Aktuell nicht unterstützte Daten",
        components: {},
    });

    useEffect(() => {
        PIOService.getPioSmallExclusions()
            .then((result: IResponse): void => {
                if (result.success) {
                    const exclusions: { [s: string]: string } = result.data?.pioSmallExclusions as {
                        [s: string]: string;
                    };
                    if (Object.keys(exclusions).length > 0) {
                        // setup components for ITabs.TabAdditionalData
                        const components: { [key: string]: IComponents } = {};
                        Object.entries(exclusions).forEach((exclusion: [string, string]): void => {
                            components[exclusion[0]] = {
                                componentProps: { resource: exclusion[1] },
                                components: [AdditionalData],
                                title: getTitleFromResourceName(exclusion[0]) + " ",
                            };
                        });
                        setAdditionalDataTab((prevState: ITab): ITab => {
                            return { ...prevState, components };
                        });
                    }
                }
            })
            .catch((error: Error) => console.error(`The pio exclusions cant be fetched from the backend: ${error}`));
    }, []);

    const tabOrganizsationOrSocial: ITab = {
        tabTitle: "Organisatorisches & Soziales",
        components: {
            PatientInfoForm: {
                formsInstances: [
                    formInstances.patientInsuranceForm,
                    formInstances.careLevelForm,
                    formInstances.patientInfoForm,
                    formInstances.patientCommunicationForm,
                ],
                componentProps: {},
                components: [PatientInsuranceForm, CareLevelForm, PatientInfoForm, PatientCommunicationForm],
                title: "Informationen zur Person",
            },
            DegreeOfDisability: {
                formsInstances: [formInstances.degreeOfDisabilityForm],
                componentProps: {},
                components: [DegreeOfDisabilityForm],
                title: "Grad der Behinderung",
            },
            PatientLocation: {
                formsInstances: [formInstances.patientLocationForm],
                componentProps: {},
                components: [PatientLocationForm],
                title: "Aktueller Aufenthaltsort",
            },
            ContactPerson: {
                formsInstances: [formInstances.contactPersonForm],
                componentProps: {},
                components: [ContactPersonForm],
                title: "Kontaktdaten von Kontaktperson(en)",
            },
            SendingOrganization: {
                formsInstances: [formInstances.sendingOrganizationForm],
                componentProps: { sending: true },
                components: [OrganizationForm],
                title: "Entsendende Einrichtung",
            },
            ReceivingOrganization: {
                formsInstances: [formInstances.receivingOrganizationForm],
                componentProps: { sending: false },
                components: [OrganizationForm],
                title: "Empfangende Einrichtung",
            },
            Practitioner: {
                formsInstances: [formInstances.practitionerForm],
                componentProps: {},
                components: [PractitionerForm],
                title: "Behandelnde Personen",
            },
            InfoAboutRelatives: {
                formsInstances: [formInstances.infoAboutRelativesForm],
                componentProps: {},
                components: [InfoAboutRelativesForm],
                title: "Pflege durch An- und Zugehörige",
            },
            LegalCare: {
                formsInstances: [formInstances.legalCareForm],
                componentProps: {},
                components: [LegalCareForm],
                title: "Gesetzliche Betreuung",
            },
            DevicesAid: {
                formsInstances: [formInstances.devicesAidForm],
                componentProps: {},
                components: [DevicesAidForm],
                title: "Hilfsmittel & Geräte",
            },
            Implant: {
                formsInstances: [formInstances.implantForm],
                componentProps: {},
                components: [ImplantForm],
                title: "Implantate",
            },
            UploadDocuments: {
                formsInstances: [formInstances.uploadDocumentsForm],
                componentProps: {},
                components: [UploadDocumentsForm],
                title: "Referenz auf Dokumente",
            },
        },
    };

    const tabCareInformation: ITab = {
        tabTitle: "Pflegerische Infobausteine",
        components: {
            Barthel: {
                formsInstances: [formInstances.barthelForm],
                componentProps: {},
                components: [BarthelForm],
                title: "Barthelgesamtindex (in Punkten)",
            },
            Risk: {
                formsInstances: [formInstances.riskForm],
                componentProps: {},
                components: [RiskForm],
                title: "Risiken",
            },
            Allergy: {
                formsInstances: [formInstances.allergyForm],
                componentProps: {},
                components: [AllergyForm],
                title: "Allergien/Unverträglichkeiten",
            },
            Orientation: {
                formsInstances: [formInstances.orientationForm],
                componentProps: {},
                components: [OrientationForm],
                title: "Bewusstseinslage und Orientierung",
            },
            StrikingBehavior: {
                formsInstances: [formInstances.strikingBehaviorForm],
                componentProps: {},
                components: [StrikingBehaviorForm],
                title: "Auffälliges Verhalten",
            },
            DeprivationOfLiberty: {
                formsInstances: [formInstances.deprivationOfLibertyForm],
                componentProps: {},
                components: [DeprivationOfLibertyForm],
                title: "Freiheitsentziehende Maßnahmen",
            },
            Isolation: {
                formsInstances: [formInstances.isolationForm],
                componentProps: {},
                components: [IsolationForm],
                title: "Hinweise zur Isolation",
            },
            VitalBody: {
                formsInstances: [formInstances.vitalBodyForm],
                componentProps: {},
                components: [VitalBodyForm],
                title: "Vitalwerte und Körpermaße",
            },
            MedicalProblem: {
                formsInstances: [formInstances.medicalProblemForm],
                componentProps: {},
                components: [MedicalProblemForm],
                title: "Medizinisches Problem/Diagnose",
            },
            CareProblem: {
                formsInstances: [formInstances.careProblemForm],
                componentProps: {},
                components: [CareProblemForm],
                title: "Pflegeproblem/Diagnose",
            },
            Breath: {
                formsInstances: [formInstances.breathForm],
                componentProps: {},
                components: [BreathForm],
                title: "Atmung",
            },
            UrinaryFecal: {
                formsInstances: [formInstances.urinaryFecalForm],
                componentProps: {},
                components: [UrinaryFecalForm],
                title: "Harn & Stuhl",
            },
            FoodType: {
                formsInstances: [formInstances.foodTypeForm],
                componentProps: {},
                components: [FoodTypeForm],
                title: "Ernährung",
            },
            Pain: {
                formsInstances: [formInstances.painForm],
                componentProps: {},
                components: [PainForm],
                title: "Schmerzsymptomatik",
            },
            NursingMeasures: {
                formsInstances: [formInstances.nursingMeasuresForm],
                componentProps: {},
                components: [NursingMeasuresForm],
                title: "Pflegerische Maßnahmen",
            },
            MedicinesInformation: {
                formsInstances: [formInstances.medicinesInformationForm],
                componentProps: {},
                components: [MedicinesInformationForm],
                title: "Medikamenteninformationen",
            },
            PatientWish: {
                formsInstances: [formInstances.patientWishForm],
                componentProps: {},
                components: [PatientWishForm],
                title: "Patientenwunsch",
            },
            ConsentStatement: {
                formsInstances: [formInstances.consentStatementForm],
                componentProps: {},
                components: [ConsentStatementForm],
                title: "Persönliche Erklärung",
            },
        },
    };

    const tabContent: ITabs = {
        TabOrganizationOrSocial: tabOrganizsationOrSocial,
        TabCareInformation: tabCareInformation,
    };

    if (Object.keys(additionalDataTab.components).length > 0) {
        tabContent.TabAdditionalData = additionalDataTab;
    }

    return tabContent;
};
