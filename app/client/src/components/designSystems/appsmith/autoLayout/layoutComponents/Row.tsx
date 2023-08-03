/* eslint-disable no-console */
import React from "react";
import type {
  HighlightInfo,
  LayoutComponentProps,
} from "utils/autoLayout/autoLayoutTypes";
import FlexLayout from "./FlexLayout";
import {
  getLayoutComponent,
  renderLayouts,
} from "utils/autoLayout/layoutComponentUtils";
import { CanvasDraggingArena } from "pages/common/CanvasArenas/CanvasDraggingArena";
import { LayoutDirection } from "utils/autoLayout/constants";
import type { FlexLayerAlignment } from "utils/autoLayout/constants";
import type { CanvasWidgetsReduxState } from "reducers/entityReducers/canvasWidgetsReducer";
import type { WidgetPositions } from "reducers/entityReducers/widgetPositionsReducer";
import {
  getVerticalHighlights,
  getWidgetRowHeight,
} from "utils/autoLayout/layoutComponentHighlightUtils";

const Row = (props: LayoutComponentProps) => {
  const {
    childrenMap,
    isDropTarget,
    layoutId,
    layoutStyle,
    layoutType,
    rendersWidgets,
  } = props;

  const renderChildren = () => {
    if (rendersWidgets) {
      if (!childrenMap) return null;
      const layout: string[] = props.layout as string[];
      return layout.map((id: string) => childrenMap[id]);
    } else {
      const layout: LayoutComponentProps[] =
        props.layout as LayoutComponentProps[];
      return renderLayouts(layout, childrenMap, props.containerProps);
    }
  };

  return (
    <FlexLayout
      canvasId={props.containerProps?.widgetId || ""}
      flexDirection="row"
      isDropTarget={isDropTarget}
      layoutId={layoutId}
      {...(layoutStyle || {})}
    >
      {isDropTarget && props.containerProps ? (
        <CanvasDraggingArena
          {...props.containerProps.snapSpaces}
          alignItems={props.containerProps.alignItems}
          canExtend={props.containerProps.canExtend}
          direction={
            layoutType.includes("ROW")
              ? LayoutDirection.Horizontal
              : LayoutDirection.Vertical
          }
          dropDisabled={!!props.containerProps.dropDisabled}
          layoutId={layoutId}
          noPad={props.containerProps.noPad}
          parentId={props.containerProps.parentId}
          snapRows={props.containerProps.snapRows}
          useAutoLayout={props.containerProps.useAutoLayout}
          widgetId={props.containerProps.widgetId}
          widgetName={props.containerProps.widgetName}
        />
      ) : null}
      {renderChildren()}
    </FlexLayout>
  );
};

Row.deriveHighlights = (data: {
  layoutProps: LayoutComponentProps;
  widgets: CanvasWidgetsReduxState;
  widgetPositions: WidgetPositions;
  alignment?: FlexLayerAlignment;
  canvasWidth?: number;
  canvasHeight?: number;
  parentLayout?: string;
}): HighlightInfo[] => {
  return getVerticalHighlights({ ...data, alignment: data?.alignment });
};

Row.addChild = (
  props: LayoutComponentProps,
  children: string[] | LayoutComponentProps[],
  index: number,
): LayoutComponentProps => {
  const layout: any = props.layout;
  return {
    ...props,
    layout: [...layout.slice(0, index), ...children, ...layout.slice(index)],
  };
};

Row.removeChild = (
  props: LayoutComponentProps,
  index: number,
): LayoutComponentProps => {
  const layout: any = props.layout;
  return {
    ...props,
    layout: [...layout.slice(0, index), ...layout.slice(index + 1)],
  };
};

Row.getHeight = (
  layoutProps: LayoutComponentProps,
  widgetPositions: WidgetPositions,
): number => {
  const { layout, layoutId, layoutStyle, rendersWidgets } = layoutProps;
  // If layout positions are being tracked, return the current value.
  if (widgetPositions[layoutId]) return widgetPositions[layoutId].height;

  // Calculate height from styles
  const layoutHeight = layoutStyle
    ? Math.max(
        parseInt(layoutStyle?.height?.toString() || "0"),
        parseInt(layoutStyle?.minHeight?.toString() || "0"),
      )
    : 0;
  // If layout has no children, return the calculated css height.
  if (!layout.length) return layoutHeight;
  // Calculate height from children.
  if (rendersWidgets) {
    // Children are widgets
    const widgetHeight: number = getWidgetRowHeight(
      layoutProps,
      widgetPositions,
    ).totalHeight;
    return Math.max(widgetHeight, layoutHeight);
  } else {
    // renders layouts
    return (layout as LayoutComponentProps[]).reduce((acc, curr) => {
      // TODO: account for wrapping.
      const Comp = getLayoutComponent(curr.layoutType);
      if (!Comp) return acc;
      const height = Comp.getHeight(curr, widgetPositions);
      return Math.max(acc, height);
    }, 0);
  }
};

export default Row;
