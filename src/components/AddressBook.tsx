import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { IOrganizationObject, IResponse } from "@thaias/pio_editor_meta";
import { Coding } from "@thaias/pio_fhir_resources";
import { Button, Form, Input, Table, Tabs, TabsProps, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { ReactElement, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { IFormFinishObject, ITableDataType } from "../@types/FormTypes";
import { AppDispatch, RootState } from "../@types/ReduxTypes";
import organizationActions from "../redux/actions/OrganizationActions";
import AddressBookService from "../services/AddressBookService";
import { getAddressLabel, getTelecomLabel } from "../services/HelperService";
import ValueSets from "../services/ValueSetService";
import "../styles/addressBook.scss";
import CustomModal from "./basic/CustomModal";
import OrganizationWrapper from "./wrappers/OrganizationWrapper";

const { Search } = Input;

//ValueSets
const organizationTypeValueSet: ValueSets = new ValueSets(
    "https://fhir.kbv.de/ValueSet/KBV_VS_MIO_ULB_Type_Of_Facility"
);

/**
 * This table component contains the address book. It is used to store and manage organizations.
 * - KBV_PR_MIO_ULB_Organization
 * @returns {React.JSX.Element} React element
 */
const AddressBook = (): React.JSX.Element => {
    //Redux, State and Form setup
    const dispatch: AppDispatch = useDispatch();
    const [modalVisible, setModalVisible] = React.useState<boolean>(false);
    const [searchText, setSearchText] = useState<string>("");
    const [organizationData, setOrganizationData] = React.useState<ITableDataType[]>([]);
    const organizationReduxState: IOrganizationObject[] = useSelector((state: RootState) => state.organizationState);
    const [form] = Form.useForm();
    const pioOpen: boolean = useSelector((state: RootState) => state.navigationState.openPio);
    //Columns for the table
    const columns: ColumnsType<ITableDataType> = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            width: 100,
            sorter: (a: ITableDataType, b: ITableDataType) => a.name.localeCompare(b.name),
        },
        {
            title: "Typ",
            dataIndex: "type",
            key: "type",
            width: 100,
            sorter: (a: ITableDataType, b: ITableDataType): number =>
                a.type && b.type ? a.type.localeCompare(b.type) : 0,
        },
        { title: "Addresse", dataIndex: "address", key: "address", width: 100 },
        { title: "Kontaktinformation", dataIndex: "telecom", key: "telecom", width: 100 },
        {
            title: "",
            dataIndex: "",
            key: "x",
            align: "right",
            width: 50,
            render: (record: ITableDataType): ReactElement =>
                !pioOpen ? (
                    <DeleteOutlined
                        className={"address-book-form-delete-icon"}
                        onClick={(): void => {
                            AddressBookService.deleteAddressBookItem(record.id).then((result: IResponse): void => {
                                if (result.success) dispatch(organizationActions.removeOrganizationRedux(record.id));
                            });
                        }}
                    />
                ) : (
                    <Tooltip title={"Während ein Pio offen ist, kann kein Eintrag gelöscht werden!"}>
                        <DeleteOutlined disabled={pioOpen} className={"remove-button disabled"} onClick={undefined} />
                    </Tooltip>
                ),
        },
    ];

    //Hook for changes in the redux state for organizations
    useEffect((): void => {
        setOrganizationData(
            organizationReduxState?.map((organization: IOrganizationObject, index: number): ITableDataType => {
                const addressString: string = organization.address
                    ? getAddressLabel(organization.address[organization.address.length - 1])
                    : "";
                const telecomString: string = getTelecomLabel(organization);
                const type: Coding | undefined = organizationTypeValueSet.getObjectByCodeSync(organization.type ?? "");
                return {
                    key: index.toString(),
                    id: organization.id,
                    name: organization.name,
                    address: addressString,
                    telecom: telecomString,
                    type: type ? type.display : "",
                    expansion: (
                        <div style={{ margin: "auto", maxWidth: 960 }}>
                            <OrganizationWrapper name={index.toString()} addressBook={true} />
                        </div>
                    ),
                };
            })
        );
        form.setFieldsValue(organizationReduxState);
    }, [organizationReduxState]);

    //Submit function for the form that writes new, updated or deleted organizations to the redux state
    const onFinish = (values: IFormFinishObject): void => {
        const organizations: IOrganizationObject[] = Object.values(values) as IOrganizationObject[];
        const updateOrganizationObjects: { uuid: string; data: IOrganizationObject }[] = organizations.map(
            (organization: IOrganizationObject): { uuid: string; data: IOrganizationObject } => {
                return { uuid: organization.id, data: organization };
            }
        );

        AddressBookService.updateAddressBookItems(updateOrganizationObjects).then((result: IResponse): void => {
            if (result.success) dispatch(organizationActions.updateOrganizationsRedux(organizations));
        });
    };

    //Filter function for searching in the table
    const getFilteredOrganisation = () => {
        return organizationData.filter((item: ITableDataType) => {
            const valuesToSearch: string = Object.values(item).join(" ").toLowerCase();
            return valuesToSearch.includes(searchText.toLowerCase());
        });
    };

    // Add new organization to Redux state and turn modal visibility off
    const handleModalSubmit = (values: IOrganizationObject): void => {
        setModalVisible(false);
        AddressBookService.addAddressBookItem(values).then((result: IResponse): void => {
            if (result.success)
                if (pioOpen) dispatch(organizationActions.addOrganizationRedux(values));
                else dispatch(organizationActions.addOrganizationRedux(values));
        });
    };

    //TabItem content (preparation in case more than one tab is needed)
    const childObj: { name: string; child: React.JSX.Element }[] = [
        {
            name: "Organisation",
            child: (
                <div onBlur={form.submit}>
                    <Form layout={"vertical"} form={form} onFinish={onFinish} name={"addressBook"}>
                        <Table
                            dataSource={searchText !== "" ? getFilteredOrganisation() : organizationData}
                            expandable={{
                                expandedRowRender: (record: ITableDataType) => record.expansion,
                            }}
                            columns={columns}
                            pagination={{ pageSize: 10 }}
                            scroll={{ y: 540 }}
                            tableLayout={"auto"}
                        />
                    </Form>
                    {modalVisible && (
                        <CustomModal<IOrganizationObject>
                            label={"Neue Einrichtung hinzufügen"}
                            content={<OrganizationWrapper />}
                            open={modalVisible}
                            onOK={handleModalSubmit}
                            onCancel={(): void => {
                                setModalVisible(false);
                            }}
                        />
                    )}
                </div>
            ),
        },
    ];

    //TabItem properties
    const items: TabsProps["items"] = childObj.map(
        ({ name, child }: { name: string; child: React.JSX.Element }, id: number) => ({
            key: id.toString(),
            label: name,
            forceRender: false,
            children: child,
        })
    );

    return (
        <div className={"address-book-screen"}>
            <div className={"address-book-heading"}>Adressbuch</div>
            <div className={"tab-wrapper"}>
                <Tabs
                    className={"tab-view"}
                    size={"large"}
                    type="card"
                    tabBarStyle={{ backgroundColor: "#FFFFFF" }}
                    color={"black"}
                    style={{ backgroundColor: "#FFFFFF" }}
                    items={items}
                    tabBarExtraContent={
                        <div className={"tab-menu-wrapper"}>
                            <Search
                                name={"searchField"}
                                placeholder={"Nach Eintrag suchen..."}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                    setSearchText(event.target.value)
                                }
                            />
                            <Button
                                className={"address-book-add-button"}
                                onClick={setModalVisible.bind(null, true)}
                                htmlType={"submit"}
                                icon={<PlusOutlined />}
                            >
                                Neuen Eintrag hinzufügen
                            </Button>
                        </div>
                    }
                />
            </div>
        </div>
    );
};

export default AddressBook;
