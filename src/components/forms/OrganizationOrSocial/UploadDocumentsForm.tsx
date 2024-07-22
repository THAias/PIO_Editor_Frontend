import {
    CheckCircleOutlined,
    DeleteOutlined,
    DownloadOutlined,
    FileTextOutlined,
    PlusOutlined,
    UploadOutlined,
} from "@ant-design/icons";
import {
    BinaryPIO,
    CodePIO,
    IEPADocumentObject,
    IResponse,
    IUploadDocumentObject,
    StringPIO,
    SubTree,
    UriPIO,
    UuidPIO,
} from "@thaias/pio_editor_meta";
import { Button, Form, FormListFieldData, Progress, Upload, UploadFile } from "antd";
import { RcFile, UploadChangeParam } from "antd/es/upload";
import fileDownload from "js-file-download";
import { UploadRequestOption } from "rc-upload/es/interface";
import React, { useEffect, useState } from "react";

import { IFormFinishObject, IFormProps } from "../../../@types/FormTypes";
import PIOService from "../../../services/PIOService";
import UUIDService from "../../../services/UUIDService";
import toastHandler from "../../ToastHandler";
import CustomModal from "../../basic/CustomModal";
import InputTextField from "../../basic/InputTextField";

/**
 * This form contains information about the references in a PIO.
 * Following FHIR resources are used:
 * - KBV_PR_MIO_ULB_DocumentReference_ePa_Reference
 * - KBV_PR_MIO_ULB_Provenance_Source_of_Information
 *
 * PIO-Small:
 * - KBV_PR_MIO_ULB_Provenance_Source_of_Information is not supported
 * - KBV_PR_MIO_ULB_DocumentReference_ePa_Reference.content.format is not supported
 * @param {IFormProps} props Props
 * @returns {React.JSX.Element} React element
 */
const UploadDocumentsForm = (props: IFormProps): React.JSX.Element => {
    const form = props.form;
    const [ePAModalVisible, setEPAModalVisible] = useState<boolean>(false);
    const [ePADocuments, setEPADocuments] = useState<IEPADocumentObject[]>([]);
    const [uploadingDocuments, setUploadingDocuments] = useState<IUploadDocumentObject[]>([]);

    /**
     * Writes all 'uploadingDocuments' (react state) to backend
     * @param {IFormFinishObject} value Return value of ant design form
     * @param {string} patientUuid Uuid of unique patient resource
     */
    const writeUploadedDocument = (value: IFormFinishObject, patientUuid: string): void => {
        uploadingDocuments.forEach((doc: IUploadDocumentObject) => {
            const subTree: SubTree = new SubTree(
                doc.uuidDocument + ".KBV_PR_MIO_ULB_DocumentReference_ePa_Reference",
                undefined
            );

            //Update document name
            doc.documentName =
                (value.UploadDocuments as IUploadDocumentObject[])?.find(
                    (item: IUploadDocumentObject) => doc.uuidDocument === item.uuidDocument
                )?.documentName ?? "";

            subTree.setValue("status", new CodePIO("current"));
            subTree.setValue("subject.reference", new UuidPIO(patientUuid));
            subTree.setValue("content.attachment.title", new StringPIO(doc.documentName));
            subTree.setValue("content.attachment.contentType", new CodePIO(doc.documentType as string));
            subTree.setValue("content.attachment.data", new BinaryPIO(doc.documentData.split(",")[1]));
            PIOService.saveSubTrees([subTree]).then((result1: IResponse) => {
                if (result1.success) {
                    UUIDService.setUUID(doc.uuidDocument, "KBV_PR_MIO_ULB_DocumentReference_ePa_Reference");
                }
            });
        });
    };

    /**
     * Writes all 'ePADocuments' (react state) to backend
     * @param {IFormFinishObject} value Return value of ant design form
     * @param {string} patientUuid Uuid of unique patient resource
     */
    const writeEpaDocument = (value: IFormFinishObject, patientUuid: string): void => {
        ePADocuments.forEach((ePA: IEPADocumentObject) => {
            const subTree: SubTree = new SubTree(
                ePA.uuidDocument + ".KBV_PR_MIO_ULB_DocumentReference_ePa_Reference",
                undefined
            );

            //Update document name and url
            const inputData: IFormFinishObject | undefined = (value.ePADocuments as IFormFinishObject[]).find(
                (item: IFormFinishObject) => item.uuidDocument === ePA.uuidDocument
            );
            if (inputData) {
                ePA.documentName = inputData.documentName as string;
                ePA.documentUrl = inputData.documentUrl as string;
            }

            subTree.setValue("status", new CodePIO("current"));
            subTree.setValue("subject.reference", new UuidPIO(patientUuid));
            subTree.setValue("content.attachment.title", new StringPIO(ePA.documentName));
            subTree.setValue("content.attachment.url", new UriPIO(ePA.documentUrl));
            PIOService.saveSubTrees([subTree]).then((result: IResponse) => {
                if (result.success) {
                    UUIDService.setUUID(ePA.uuidDocument, "KBV_PR_MIO_ULB_DocumentReference_ePa_Reference");
                }
            });
        });
    };

    /**
     * Stores data from input fields to SubTree state. Triggered by the onBlur event of the form.
     * @param {IFormFinishObject} value Object which holds the input data. The key is the 'name' of the input field
     */
    const onFinish = (value: IFormFinishObject): void => {
        //Delete all document resources from backend and UUIDService -> then write all resources again
        const allBackendUuids: string[] = UUIDService.getUUIDs("KBV_PR_MIO_ULB_DocumentReference_ePa_Reference") ?? [];
        const subTreesToBeDeleted: SubTree[] = allBackendUuids.map(
            (uuid: string): SubTree => new SubTree(uuid, undefined)
        );
        PIOService.deleteSubTrees(subTreesToBeDeleted).then((result: IResponse) => {
            if (result.success) {
                UUIDService.deleteUUIDs(allBackendUuids);

                //Write subTrees
                const patientUuid: string = UUIDService.getUUID("KBV_PR_MIO_ULB_Patient");
                writeUploadedDocument(value, patientUuid);
                writeEpaDocument(value, patientUuid);
            }
        });
    };

    /**
     * Converts a documentRefernece subTree to IEPADocumentObject or IUploadDocumentObject.
     * @param {SubTree} subTree Current KBV_PR_MIO_ULB_DocumentReference_ePa_Reference subTree
     * @returns {{ type: string, object: IEPADocumentObject | IUploadDocumentObject }} Object and its type
     */
    const convertToObject = (
        subTree: SubTree
    ): { type: string; object: IEPADocumentObject | IUploadDocumentObject } => {
        //Write all general data to object
        const generalObject: IEPADocumentObject | IUploadDocumentObject = {} as
            | IEPADocumentObject
            | IUploadDocumentObject;
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

    //Initialize react state when reloading the page or opening a new PIO
    useEffect((): void => {
        //Clear react states
        setEPADocuments([]);
        setUploadingDocuments([]);

        //Get subTree paths
        const allDocumentPaths: string[] | undefined = UUIDService.getUUIDs(
            "KBV_PR_MIO_ULB_DocumentReference_ePa_Reference"
        )?.map((uuid: string): string => uuid + ".KBV_PR_MIO_ULB_DocumentReference_ePa_Reference");

        //Write subTree data to react state
        if (allDocumentPaths) {
            PIOService.getSubTrees(allDocumentPaths).then((result: IResponse) => {
                if (result.success) {
                    const ePA: IEPADocumentObject[] = [];
                    const documents: IUploadDocumentObject[] = [];
                    (result.data?.subTrees as SubTree[]).forEach((subTree: SubTree) => {
                        const temp: { type: string; object: IEPADocumentObject | IUploadDocumentObject } =
                            convertToObject(subTree);
                        if (temp.type === "ePA") ePA.push(temp.object as IEPADocumentObject);
                        else documents.push(temp.object as IUploadDocumentObject);
                    });
                    setUploadingDocuments(documents);
                    setEPADocuments(ePA);
                }
            });
        }
    }, []);

    //Update form fields when react state is changing
    useEffect((): void => {
        form.setFieldsValue({ ePADocuments: ePADocuments });
    }, [form, ePADocuments]);
    useEffect((): void => {
        form.setFieldsValue({ UploadDocuments: uploadingDocuments });
    }, [form, uploadingDocuments]);

    /**
     * The function to transform an uploaded document to bytes64 and return the file and the progress and a status
     * @param {UploadRequestOption} options Options from the uploadRequest
     */
    const uploadDocument = async (options: UploadRequestOption): Promise<void> => {
        const { onSuccess, onError, file, onProgress } = options;
        const reader: FileReader = new FileReader();
        new Promise((resolve, reject): void => {
            reader.onerror = (): void => {
                reader.abort();
                reject(new DOMException("Problem parsing input file."));
            };
            reader.readAsDataURL(file as RcFile);
            reader.onload = (): void => {
                const base64String: string | ArrayBuffer | null = reader.result;
                if (base64String) {
                    (file as UploadFile).url = base64String.toString();
                }
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

    /**
     * Transform the upload icon according to the status of the upload file
     * @param {string} color the current color status
     * @param {string} status the status of the file
     * @param {number} percent the uploading process progress in percent
     * @returns {React.JSX.Element} React element
     */
    const getUploadDocumentIcon = (color: string, status?: string, percent?: number): React.JSX.Element => {
        switch (status) {
            case "error":
                return <DeleteOutlined style={{ color: color, fontSize: "1.2rem" }} />;
            case "success":
                return <CheckCircleOutlined style={{ color: "var(color-green)", fontSize: "1.2rem" }} />;
            case "done":
                return <FileTextOutlined style={{ color: color, fontSize: "1.2rem" }} />;
            case "uploading":
            default:
                return (
                    <Progress
                        percent={percent}
                        status={"active"}
                        type={"circle"}
                        style={{ marginBottom: 0, alignSelf: "center" }}
                        size={20}
                    />
                );
        }
    };

    /**
     * The onChange function to update the upload status
     * @param {UploadChangeParam} uploadChangeObject The Object which contains the file and the event. The event holds the percentage of the uploading process
     */
    const updateDocuments = (uploadChangeObject: UploadChangeParam): void => {
        const fileIndex: number = uploadingDocuments.findIndex(
            (fileObject: IUploadDocumentObject): boolean => fileObject.fileId === uploadChangeObject.file.uid
        );
        if (fileIndex !== -1) {
            setUploadingDocuments((prevState: IUploadDocumentObject[]) => {
                prevState[fileIndex.valueOf()].percent = uploadChangeObject.event?.percent;
                prevState[fileIndex.valueOf()].status = uploadChangeObject.file.status;
                prevState[fileIndex.valueOf()].documentData = uploadChangeObject.file.url ?? "";
                return [...prevState];
            });
        }
    };

    const base64ToBlob = (b64Data: string, contentType: string) => {
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

    /**
     * The upload render Item (Name and File) which is shown under the uploadButton
     * @param {number} key the div key for the list
     * @param {number} name the id of the FormList
     * @param {Function} remove the remove function from the FormList
     * @returns {React.JSX.Element} React element
     */
    const getUploadedDocumentRenderItem = (
        key: number,
        name: number,
        remove: (index: number | number[]) => void
    ): React.JSX.Element => {
        const currentFile: IUploadDocumentObject = uploadingDocuments[name.valueOf()];
        const color: string = currentFile?.status === "error" ? "var(--color-red)" : "black";
        return (
            <div key={key}>
                <div className={"form-line"}>
                    <div className={"left"}>
                        <InputTextField
                            name={[name, "documentName"]}
                            label={"Name des Dokuments"}
                            placeholder={currentFile.fileName}
                            rules={[{ required: true, message: "Bitte geben Sie einen Namen ein!" }]}
                        />
                    </div>
                    <div className={"right"}>
                        <div className={"base-input"} style={{ width: "100%" }}>
                            <Form.Item label={" "}>
                                <div className={"document-upload-form-wrapper"}>
                                    {getUploadDocumentIcon(color, currentFile.status, currentFile.percent)}
                                    <div className={"document-upload-form-item"} style={{ color: color }}>
                                        {currentFile.fileName}
                                    </div>
                                    <DownloadOutlined
                                        className={"document-upload-form-download-icon"}
                                        onClick={(): void => {
                                            const base64String: string = currentFile.documentData as string;
                                            const blob: Blob = base64ToBlob(
                                                base64String,
                                                currentFile.documentType as string
                                            );
                                            fileDownload(blob, currentFile.fileName as string);
                                        }}
                                    />
                                    <DeleteOutlined
                                        className={"document-upload-form-delete-icon"}
                                        onClick={(): void => {
                                            remove(name);
                                            const tempUploadingDocuments: IUploadDocumentObject[] = [
                                                ...uploadingDocuments,
                                            ];
                                            tempUploadingDocuments.splice(name.valueOf(), 1);
                                            setUploadingDocuments(tempUploadingDocuments);
                                            form.submit();
                                        }}
                                    />
                                </div>
                            </Form.Item>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    /**
     * The EPA render Item (Name and URL) is shown under the uploadButton
     * @param {number} key the div key for the list
     * @param {number} name the id of the FormList
     * @param {Function} remove the remove function from the FormList
     * @returns {React.JSX.Element} React element
     */
    const getEPADocumentRenderItem = (
        key: number,
        name: number,
        remove: (index: number | number[]) => void
    ): React.JSX.Element => (
        <div key={key} className={"form-line"}>
            <div className={"left"}>
                <InputTextField
                    name={[name, "documentName"]}
                    label={"Name des Dokuments"}
                    placeholder={"Name des Dokuments"}
                    rules={[{ required: true, message: "Bitte geben Sie einen Namen ein!" }]}
                />
            </div>
            <div className={"right"}>
                <div className={"document-upload-form-wrapper"}>
                    <InputTextField
                        name={[name, "documentUrl"]}
                        label={"URL eines ePA Dokuments"}
                        placeholder={"URL eines ePA Dokuments"}
                        rules={[{ required: true, message: "Bitte geben Sie eine URL ein!" }]}
                    />
                    <div className={"base-input document-upload-form-delete"}>
                        <Form.Item label={" "}>
                            <DeleteOutlined
                                className={"document-upload-form-delete-icon"}
                                onClick={() => {
                                    const tempEPADocuments: IEPADocumentObject[] = [...ePADocuments];
                                    tempEPADocuments.splice(name, 1);
                                    setEPADocuments(tempEPADocuments);
                                    remove(name);
                                    form.submit();
                                }}
                            />
                        </Form.Item>
                    </div>
                </div>
            </div>
        </div>
    );

    /**
     * The preparation step which is executed before the upload. Invalid document will be blocked before uploading by
     * return value.
     * @param {RcFile} file The file tu upload
     * @returns {boolean} If return value is 'false', the upload will be blocked
     */
    const beforeUpload = (file: RcFile): boolean => {
        const validFileTypes: string[] = [
            "application/pdf",
            "image/jpeg",
            "image/png",
            "image/tiff",
            "text/plain",
            "text/rtf",
        ];
        if (!validFileTypes.includes(file.type)) {
            toastHandler.error("Der Upload von diesem Dateityp wird nicht unterstützt");
            return false;
        }

        const fileObject: IUploadDocumentObject = {} as IUploadDocumentObject;
        fileObject.uuidDocument = UuidPIO.generateUuid();
        fileObject.uuidProvenance = "";
        fileObject.documentType = file.type;
        fileObject.status = "uploading";
        fileObject.percent = undefined;
        fileObject.fileId = file.uid;
        fileObject.fileName = file.name;
        setUploadingDocuments((prevState: IUploadDocumentObject[]): IUploadDocumentObject[] => [
            ...prevState,
            fileObject,
        ]);
        return true;
    };

    return (
        <>
            <div onBlur={form.submit}>
                <Form layout={"vertical"} name={"UploadReferenzForm"} onFinish={onFinish} form={form}>
                    <Form.Item name={"documentUploadFile"}>
                        <div>
                            <Upload
                                listType={"picture"}
                                className={"document-upload-form"}
                                multiple
                                supportServerRender={false}
                                customRequest={uploadDocument}
                                showUploadList={false}
                                onChange={updateDocuments}
                                beforeUpload={beforeUpload}
                            >
                                <div className={"form-line"}>
                                    <div className={"left"}>
                                        <Button className={"upload-button"} icon={<UploadOutlined />}>
                                            Dokument hochladen
                                        </Button>
                                    </div>
                                </div>
                            </Upload>
                            <Form.List name={"UploadDocuments"}>
                                {(fields: FormListFieldData[], { remove }) => (
                                    <>
                                        {fields.map(({ key, name }) =>
                                            getUploadedDocumentRenderItem(key, name, remove)
                                        )}
                                    </>
                                )}
                            </Form.List>
                        </div>
                    </Form.Item>
                    <Form.List name={"ePADocuments"}>
                        {(fields, { remove }) => (
                            <div className={"document-upload-form"}>
                                <div className={"form-line"}>
                                    <div className={"left"}>
                                        <Button
                                            className={"upload-button"}
                                            icon={<PlusOutlined />}
                                            onClick={() => setEPAModalVisible(true)}
                                        >
                                            ePa hinzufügen
                                        </Button>
                                    </div>
                                </div>
                                {fields.map(({ key, name }) => getEPADocumentRenderItem(key, name, remove))}
                            </div>
                        )}
                    </Form.List>
                </Form>
            </div>
            <CustomModal<IEPADocumentObject>
                label={"Hinzufügen eines ePA Dokuments"}
                content={
                    <div className={"form-line"}>
                        <div className={"left"}>
                            <InputTextField
                                name={"documentName"}
                                label={"Name des Dokuments"}
                                placeholder={"Name des Dokuments"}
                                rules={[{ required: true, message: "Bitte geben Sie einen Namen ein!" }]}
                            />
                        </div>
                        <div className={"right"}>
                            <InputTextField
                                name={"documentUrl"}
                                label={"URL eines ePA Dokuments"}
                                placeholder={"URL eines ePA Dokuments"}
                                rules={[{ required: true, message: "Bitte geben Sie eine URL ein!" }]}
                            />
                        </div>
                    </div>
                }
                open={ePAModalVisible}
                onCancel={() => setEPAModalVisible(false)}
                onOK={(values: IEPADocumentObject) => {
                    values.uuidDocument = UuidPIO.generateUuid();
                    values.uuidProvenance = "";
                    setEPADocuments([...ePADocuments, values]);
                    setEPAModalVisible(false);
                    form.submit();
                }}
            />
        </>
    );
};

export default UploadDocumentsForm;
