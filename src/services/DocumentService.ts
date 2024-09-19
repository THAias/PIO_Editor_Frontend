import { SubTree } from "@thaias/pio_editor_meta";
import { IEPADocumentObject, IUploadDocumentObject } from "@thaias/pio_editor_meta/dist/types";

/**
 * Converts a documentRefernece subTree to IEPADocumentObject or IUploadDocumentObject.
 * @param {SubTree} subTree Current KBV_PR_MIO_ULB_DocumentReference_ePa_Reference subTree
 * @returns {{ type: string, object: IEPADocumentObject | IUploadDocumentObject }} Object and its type
 */
export const convertToObject = (
    subTree: SubTree
): { type: string; object: IEPADocumentObject | IUploadDocumentObject } => {
    //Write all general data to object
    const generalObject: IEPADocumentObject | IUploadDocumentObject = {} as IEPADocumentObject | IUploadDocumentObject;
    generalObject.documentName = subTree.getSubTreeByPath("content.attachment.title").getValueAsString() ?? "";
    generalObject.uuidDocument = subTree.absolutePath.split(".")[0];
    generalObject.uuidProvenance = "";

    //Write specific data (ePADocument or UploadedFile)
    if (subTree.getSubTreeByPath("content.attachment.contentType").getValueAsString()) {
        //Write specific data for uploaded documents
        const uploading: IUploadDocumentObject = generalObject as IUploadDocumentObject;
        const base64String: string = subTree.getSubTreeByPath("content.attachment.data").getValueAsString() ?? "";
        const documentType: string | undefined = subTree
            .getSubTreeByPath("content.attachment.contentType")
            .getValueAsString();
        let fileEnding: string | undefined = documentType ? documentType.split("/")[1] : undefined;
        if (fileEnding && ["plain", "rtf"].includes(fileEnding)) fileEnding = "txt";

        uploading.fileId = uploading.uuidDocument;
        uploading.fileName = uploading.documentName + (fileEnding ? "." + fileEnding : "");
        uploading.documentData = "data:" + documentType + ";base64," + base64String;
        uploading.documentType = documentType;
        uploading.status = "done";

        return { type: "document", object: uploading };
    } else {
        //Write specific data for ePA documents
        const ePA: IEPADocumentObject = generalObject as IEPADocumentObject;
        ePA.documentUrl = subTree.getSubTreeByPath("content.attachment.url").getValueAsString() ?? "";
        return { type: "ePA", object: ePA };
    }
};

export const base64ToBlob = (b64Data: string, contentType: string) => {
    contentType = contentType || "";
    const sliceSize = 512;
    b64Data = b64Data.replace(/^[^,]+,/, "");
    b64Data = b64Data.replace(/\s/g, "");
    const byteCharacters = window.atob(b64Data);
    const byteArrays: Uint8Array[] = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i.valueOf()] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
};
