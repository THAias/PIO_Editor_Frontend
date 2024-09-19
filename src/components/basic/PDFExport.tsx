import { drawDOM, exportPDF } from "@progress/kendo-drawing";
import { IEPADocumentObject, IResponse, IUploadDocumentObject, SubTree } from "@thaias/pio_editor_meta/dist/types";
import dayjs from "dayjs";
import fileDownload from "js-file-download";
import { PDFDocument, PDFPage } from "pdf-lib";

import { reduxStore } from "../../redux/store";
import { convertToObject } from "../../services/DocumentService";
import PIOService from "../../services/PIOService";
import UUIDService from "../../services/UUIDService";

/**
 * Gets the whole form of the pio as HTML element. Adds a signature field at the end.
 * @returns {HTMLElement} Returns the pio form as HTML element
 */
const getPioHTMLElement = (): HTMLElement => {
    const contentTabs = document.getElementsByClassName("main-content");
    const patientName = document.getElementById("patient-name")?.cloneNode(true);
    const pdfElement = document.createElement("div") as HTMLElement;
    if (patientName) pdfElement.appendChild(patientName);
    Array.from(contentTabs).forEach((tab) => {
        const newTab = tab.cloneNode(true) as HTMLElement;
        Array.from(newTab.getElementsByTagName("input")).forEach((i) => {
            const lineHeight = 25;
            const characterToBreak = 30;
            const inputHeight = Math.ceil(i.value.length / characterToBreak) * lineHeight;
            i.style.height = `${inputHeight || lineHeight}px`;
        });
        pdfElement.appendChild(newTab);
    });
    const signatureField = document.createElement("div");
    signatureField.classList.add("signature");
    signatureField.innerText = "Signatur:";
    pdfElement.appendChild(signatureField);
    pdfElement.querySelectorAll(".accordion-new-entry").forEach((el) => {
        el.remove();
    });
    pdfElement.classList.add("pdf-override");
    return pdfElement;
};

/**
 * Gets all referenced documents paths from backend.
 * @returns {string[] | undefined} Returns the paths of referenced documents when found
 */
const getDocumentPaths = (): string[] | undefined => {
    return UUIDService.getUUIDs("KBV_PR_MIO_ULB_DocumentReference_ePa_Reference")?.map(
        (uuid: string): string => uuid + ".KBV_PR_MIO_ULB_DocumentReference_ePa_Reference"
    );
};

/**
 * Gets all referenced documents as an array of document objects by using an array of paths.
 * @param {string[]} allDocumentPaths Path to all referenced documents
 * @returns {Promise<IUploadDocumentObject[]>} Returns Promise with referenced documents as an array of document objects
 */
const getDocuments = async (allDocumentPaths: string[]): Promise<IUploadDocumentObject[]> => {
    const documents: IUploadDocumentObject[] = [];
    await PIOService.getSubTrees(allDocumentPaths).then(async (result: IResponse) => {
        if (result.success) {
            (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree) => {
                const temp: { type: string; object: IEPADocumentObject | IUploadDocumentObject } =
                    convertToObject(subTree);
                if (temp.type === "document") documents.push(temp.object as IUploadDocumentObject);
            });
        }
    });
    return documents;
};

/**
 * Adds referenced documents that are of type pdf, png or jpg to the current PDF file.
 * @param {PDFDocument} pioPdf Current PDF document of Pio
 * @param {IUploadDocumentObject} documents Array of referenced documents
 */
const addPdfOrImageDocumentsToPioPDF = async (
    pioPdf: PDFDocument,
    documents: IUploadDocumentObject[]
): Promise<void> => {
    for (const currentFile of documents) {
        const base64String: string = currentFile.documentData.split(";base64,")[1] as string;
        if (currentFile.documentType === "application/pdf") {
            const currentPdf: PDFDocument = await PDFDocument.load(base64String);
            const copiedPages: PDFPage[] = await pioPdf.copyPages(currentPdf, currentPdf.getPageIndices());
            copiedPages.forEach((page) => {
                pioPdf.addPage(page);
            });
        } else if (currentFile.documentType === "image/png" || currentFile.documentType === "image/jpeg") {
            const imgBytes = Uint8Array.from(atob(base64String), (c) => c.charCodeAt(0));
            const imgImage =
                currentFile.documentType === "image/png"
                    ? await pioPdf.embedPng(imgBytes)
                    : await pioPdf.embedJpg(imgBytes);
            const imgPage = pioPdf.addPage();
            const imgDims = imgImage.scaleToFit(imgPage.getWidth(), imgPage.getHeight() - 10);
            imgPage.setSize(imgPage.getWidth(), imgPage.getHeight());
            imgPage.drawImage(imgImage, {
                y: imgPage.getHeight() - imgDims.height,
                width: imgDims.width,
                height: imgDims.height,
            });
            imgPage.drawText(currentFile.fileName || "", {
                x: 10,
                y: imgPage.getHeight() - imgDims.height - 20,
                size: 10,
            });
        }
    }
};

/**
 * Adds fixed elements like header, page numbers, footer to a pdf document
 * @param {PDFDocument} pioPdf Currently crated PDF document
 * @param {number} pioPdfPageAmount Amount of pages before referenced documents are added
 * @param {string} sendingOrganization Name of the sending organization
 * @param {number} totalPages Amount of all pages of the PDF document
 */
const addFixedElementsToPDF = (
    pioPdf: PDFDocument,
    pioPdfPageAmount: number,
    sendingOrganization: string,
    totalPages: number
): void => {
    const state = reduxStore.getState();
    const { userData } = state.authState;
    const sendingPerson = "Bearbeitende Person: " + userData.firstName + " " + userData.lastName;
    const date = dayjs();
    pioPdf.getPages().forEach((page, index) => {
        if (index < pioPdfPageAmount) {
            page.drawText(
                `Entsendende Einrichtung: ${sendingOrganization} / ${sendingPerson} / ${date.format("DD.MM.YYYY")}`,
                {
                    x: 30,
                    y: page.getHeight() - 25,
                    size: 8,
                    opacity: 0.5,
                }
            );
        }
        page.drawText(`Seite ${index + 1} von ${totalPages}`, {
            x: page.getWidth() - 80,
            y: 20,
            size: 8,
        });
    });
};

/**
 * Takes the pio form as html element and adds a table of content of referenced documents as well as txt files.
 * @param {IUploadDocumentObject} documents Array containing referenced documents
 * @param {HTMLElement} pioPdfElement The html element of the whole pio form
 */
const addTextDocumentsAndTableOfContentToHtmlElement = (
    documents: IUploadDocumentObject[],
    pioPdfElement: HTMLElement
): void => {
    const titlesList: HTMLElement = document.createElement("ul");
    titlesList.classList.add("keep-together");
    const textDocuments: HTMLElement = document.createElement("div");
    documents.sort((doc) => (doc.documentType === "text/plain" ? -1 : 1));
    for (const currentFile of documents) {
        const titlesItem: HTMLElement = document.createElement("li");
        titlesItem.innerText = currentFile.fileName || currentFile.documentName;
        titlesList.appendChild(titlesItem);
        if (currentFile.documentType === "text/plain") {
            const base64StringText: string = currentFile.documentData.split(";base64,")[1] as string;
            const textBytes: Uint8Array = Uint8Array.from(atob(base64StringText), (c) => c.charCodeAt(0));
            const textContent: string = new TextDecoder("utf-8").decode(textBytes);
            const textField: HTMLElement = document.createElement("div");
            textField.innerText = textContent;
            const pageBreak: HTMLElement = document.createElement("div");
            pageBreak.classList.add("page-break");
            textDocuments.appendChild(pageBreak);
            textDocuments.appendChild(textField);
        }
    }
    const documentsHeader: HTMLElement = document.createElement("div");
    documentsHeader.innerText = "Anhängende Dokumente:";
    pioPdfElement.appendChild(documentsHeader);
    pioPdfElement.appendChild(titlesList);
    pioPdfElement.appendChild(textDocuments);
};

/**
 * Generates a pdf-file, containing the pio-ulb like it is viewed in the editor, and referenced documents at the end.
 * @param {string} sendingOrganization The name of the organization that is currently set at sending organization
 * @returns {Promise<void>} Returns an empty Promise when successful
 */
export const exportPioPDF = async (sendingOrganization: string): Promise<void> => {
    // Styling options for the PDF
    const pdfOptions = {
        forcePageBreak: ".page-break",
        keepTogether: ".ant-form-item, .signature, .keep-together, .ant-collapse-item",
        paperSize: "A4",
        scale: 0.5,
        margin: { left: "12mm", right: "12mm", top: "15mm", bottom: "20mm" },
    };
    try {
        const documents: IUploadDocumentObject[] = [];
        const allDocumentPaths = getDocumentPaths();
        const pioPdfElement = getPioHTMLElement();

        if (allDocumentPaths) {
            documents.push(...(await getDocuments(allDocumentPaths)));
            addTextDocumentsAndTableOfContentToHtmlElement(documents, pioPdfElement);
        }
        // pioPdfElement need to be appended to the document body for the generation process to work
        document.body.appendChild(pioPdfElement);
        // draws a pdf out of a HTML-Element, loads it as Uint8Array, appends referenced documents and downloads the completed pdf
        drawDOM(pioPdfElement, pdfOptions)
            .then((group) => {
                return exportPDF(group, {});
            })
            .then(async (dataUri) => {
                const pioPdf = await PDFDocument.load(dataUri);
                const pioPdfPageAmount = pioPdf.getPages().length;
                await addPdfOrImageDocumentsToPioPDF(pioPdf, documents);
                const totalPages = pioPdf.getPages().length;
                addFixedElementsToPDF(pioPdf, pioPdfPageAmount, sendingOrganization, totalPages);
                const mergedPdfBytes = await pioPdf.save();
                const mergedBlob = new Blob([mergedPdfBytes], { type: "application/pdf" });
                fileDownload(mergedBlob, "PIOExport.pdf");
                pioPdfElement.remove();
            });
    } catch (error) {
        console.error("An error occurred during pdf export:" + error);
    }
};
