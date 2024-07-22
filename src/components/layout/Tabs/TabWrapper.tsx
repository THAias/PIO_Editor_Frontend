import { CaretLeftOutlined, CaretRightOutlined } from "@ant-design/icons";
import { Anchor, Empty, Layout } from "antd";
import React, { RefObject, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AnyAction } from "redux";

import { IComponents, IRenderTabs, ITabContentProps } from "../../../@types/FormTypes";
import { AppDispatch, RootState } from "../../../@types/ReduxTypes";
import navigationActions from "../../../redux/actions/NavigationActions";
import { getItems, zeroWidthTriggerStyle } from "./TabHelper";
import TitleFormWrapper from "./TitleFormWrapper";

const { Content, Sider } = Layout;

/**
 * Render the Tab content
 * @param {ITabContentProps} props Props
 * @returns {React.JSX.Element} React element
 */
const TabWrapper = (props: ITabContentProps): React.JSX.Element => {
    const collapsed = useSelector((state: RootState) => state.navigationState.collapsedMenu);
    const mainContentRef: RefObject<HTMLDivElement> = useRef<HTMLDivElement>(null);
    const dispatch: AppDispatch = useDispatch();

    useEffect((): void => {
        props.setRenderedTabs((prevState: IRenderTabs): IRenderTabs => ({ ...prevState, [props.tabName]: true }));
    }, []);

    /**
     * Helper function which return the arrow for the sideMENU
     * @returns {React.JSX.Element} React element
     */
    const sideTrigger: React.JSX.Element = (
        <div className={"tab-sidebar-trigger"}>{collapsed ? <CaretRightOutlined /> : <CaretLeftOutlined />}</div>
    );

    /**
     * function to set the title and add it to teh sideMenu
     * @param {string} title the title of the section of the PIO
     * @returns {React.JSX.Element} React element
     */
    const setTitle = (title: string): React.JSX.Element => (
        <div className={"form-title"} id={title}>
            {title}
        </div>
    );

    return Object.keys(props.components).length !== 0 && props.components.constructor === Object ? (
        <Layout>
            <Sider
                id={"pio-sidebar"}
                collapsible
                collapsedWidth={0}
                width={285}
                theme={"light"}
                collapsed={collapsed}
                onCollapse={(value: boolean): AnyAction => dispatch(navigationActions.collapseMenuRedux(value))}
                zeroWidthTriggerStyle={zeroWidthTriggerStyle}
                trigger={sideTrigger}
            >
                <div className={"sidebar-wrapper"} id={"sidebar-wrapper"}>
                    <Anchor
                        offsetTop={0}
                        className={"sidebar-anchor"}
                        replace={true}
                        style={{ position: "absolute", top: 8, width: "100%" }}
                        items={getItems(props.components)}
                        getContainer={() => mainContentRef.current as HTMLElement}
                        affix={false}
                        showInkInFixed={true}
                    />
                </div>
            </Sider>
            <Layout>
                <Content className={"main-content-wrapper"} id={"pio-main-content-wrapper"} ref={mainContentRef}>
                    <div className={"main-content"}>
                        {Object.entries(props.components).map(
                            ([title, entry]: [string, IComponents]): React.JSX.Element => (
                                <TitleFormWrapper
                                    key={title}
                                    title={setTitle(entry.title)}
                                    component={entry.components}
                                    form={entry.formsInstances}
                                    props={entry.componentProps}
                                />
                            )
                        )}
                    </div>
                </Content>
            </Layout>
        </Layout>
    ) : (
        <Layout>
            <Content>
                <div className={"empty-content"}>
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
            </Content>
        </Layout>
    );
};

export default TabWrapper;
