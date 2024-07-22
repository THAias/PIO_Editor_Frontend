import { AnchorLinkItemProps } from "antd/es/anchor/Anchor";
import { CSSProperties } from "react";

import { IComponents } from "../../../@types/FormTypes";

/**
 * Function to get all titles for the sideMenu
 * @param {{ [key: string]: IComponents }} components all the headers in the tab
 * @returns {AnchorLinkItemProps[]} List of items for the sideMenu
 */
export const getItems = (components: { [key: string]: IComponents }): AnchorLinkItemProps[] =>
    Object.values(components)?.map(
        (component: IComponents): AnchorLinkItemProps => ({
            key: component.title,
            title: component.title,
            href: `#${component.title}`,
        })
    );

/**
 * CSS styling for the collapsed sideMenu
 */
export const zeroWidthTriggerStyle: CSSProperties = {
    insetInlineEnd: "-15px",
    top: 0,
    height: "100%",
    backgroundColor: "rgba(7, 78, 232, 0.1)",
    width: "15px",
    border: 0,
};
