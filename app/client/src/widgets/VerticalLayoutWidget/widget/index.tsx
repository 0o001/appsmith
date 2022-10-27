import { map } from "lodash";
import React from "react";

import WidgetFactory, { DerivedPropertiesMap } from "utils/WidgetFactory";
import BaseWidget, { WidgetProps, WidgetState } from "widgets/BaseWidget";

import {
  AlignItems,
  JustifyContent,
  LayoutDirection,
} from "components/constants";
import {
  CONTAINER_GRID_PADDING,
  GridDefaults,
  MAIN_CONTAINER_WIDGET_ID,
  WIDGET_PADDING,
} from "constants/WidgetConstants";
import { ValidationTypes } from "constants/WidgetValidation";
import { CanvasDraggingArena } from "pages/common/CanvasArenas/CanvasDraggingArena";
import { AutoLayoutContext } from "utils/autoLayoutContext";
import { getCanvasSnapRows } from "utils/WidgetPropsUtils";
import { ContainerStyle } from "widgets/ContainerWidget/component";
import VerticalLayoutComponent from "../component";

class VerticalLayoutWidget extends BaseWidget<
  VerticalLayoutWidgetProps<WidgetProps>,
  WidgetState
> {
  constructor(props: VerticalLayoutWidgetProps<WidgetProps>) {
    super(props);
    this.renderChildWidget = this.renderChildWidget.bind(this);
  }

  static getPropertyPaneConfig() {
    return [
      {
        helpText: "Controls alignment of the content",
        propertyName: "justifyContent",
        label: "Align content",
        controlType: "DROP_DOWN",
        defaultValue: JustifyContent.FlexStart,
        options: [
          { label: "Flex start", value: JustifyContent.FlexStart },
          { label: "Center", value: JustifyContent.Center },
          { label: "Space around", value: JustifyContent.SpaceAround },
          { label: "Space between", value: JustifyContent.SpaceBetween },
          { label: "Space evently", value: JustifyContent.SpaceEvenly },
        ],
        isJSConvertible: false,
        isBindProperty: false,
        isTriggerProperty: false,
        validation: { type: ValidationTypes.TEXT },
      },
    ];
  }

  static getDerivedPropertiesMap(): DerivedPropertiesMap {
    return {};
  }

  static getDefaultPropertiesMap(): Record<string, string> {
    return {};
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {};
  }

  getSnapSpaces = () => {
    const { componentWidth } = this.getComponentDimensions();
    // For all widgets inside a container, we remove both container padding as well as widget padding from component width
    let padding = (CONTAINER_GRID_PADDING + WIDGET_PADDING) * 2;
    if (
      this.props.widgetId === MAIN_CONTAINER_WIDGET_ID ||
      this.props.type === "CONTAINER_WIDGET"
    ) {
      //For MainContainer and any Container Widget padding doesn't exist coz there is already container padding.
      padding = CONTAINER_GRID_PADDING * 2;
    }
    if (this.props.noPad) {
      // Widgets like ListWidget choose to have no container padding so will only have widget padding
      padding = WIDGET_PADDING * 2;
    }
    let width = componentWidth;
    width -= padding;
    return {
      snapRowSpace: GridDefaults.DEFAULT_GRID_ROW_HEIGHT,
      snapColumnSpace: componentWidth
        ? width / GridDefaults.DEFAULT_GRID_COLUMNS
        : 0,
    };
  };

  renderChildWidget(childWidgetData: WidgetProps): React.ReactNode {
    // For now, isVisible prop defines whether to render a detached widget
    if (childWidgetData.detachFromLayout && !childWidgetData.isVisible) {
      return null;
    }

    const { componentHeight, componentWidth } = this.getComponentDimensions();

    childWidgetData.rightColumn = componentWidth;
    childWidgetData.bottomRow = this.props.shouldScrollContents
      ? childWidgetData.bottomRow
      : componentHeight;
    childWidgetData.minHeight = componentHeight;
    childWidgetData.isVisible = this.props.isVisible;
    childWidgetData.shouldScrollContents = false;
    childWidgetData.canExtend = this.props.shouldScrollContents;

    childWidgetData.parentId = this.props.widgetId;
    // Pass layout controls to children
    const layoutProps = {
      useAutoLayout: true,
      direction: LayoutDirection.Vertical,
      justifyContent: JustifyContent.FlexStart,
      alignItems: AlignItems.Stretch,
    };
    return WidgetFactory.createWidget(
      { ...childWidgetData, ...layoutProps },
      this.props.renderMode,
    );
  }

  renderChildren = () => {
    return map(this.props.children, this.renderChildWidget);
  };

  getPageView() {
    const snapRows = getCanvasSnapRows(
      this.props.bottomRow,
      this.props.canExtend,
    );
    return (
      <AutoLayoutContext.Provider
        value={{
          alignItems: AlignItems.Stretch,
          useAutoLayout: true,
          direction: LayoutDirection.Vertical,
          justifyContent: JustifyContent.FlexStart,
          disabledResizeHandles: [
            "left",
            "right",
            "bottomRight",
            "topLeft",
            "topRight",
            "bottomLeft",
          ],
        }}
      >
        <VerticalLayoutComponent {...this.props}>
          {this.props.type === "CANVAS_WIDGET" && (
            <>
              <CanvasDraggingArena
                {...this.getSnapSpaces()}
                canExtend={this.props.canExtend}
                direction={LayoutDirection.Vertical}
                dropDisabled={!!this.props.dropDisabled}
                noPad={this.props.noPad}
                parentId={this.props.parentId}
                snapRows={snapRows}
                useAutoLayout
                widgetId={this.props.widgetId}
              />
              {/*
            // Removing Canvas Selection and grouping in the POC
               <CanvasSelectionArena
                {...this.getSnapSpaces()}
                canExtend={this.props.canExtend}
                dropDisabled={!!this.props.dropDisabled}
                parentId={this.props.parentId}
                snapRows={snapRows}
                widgetId={this.props.widgetId}
              /> */}
            </>
          )}
          {/* <WidgetsMultiSelectBox
            {...this.getSnapSpaces()}
            noContainerOffset={!!this.props.noContainerOffset}
            widgetId={this.props.widgetId}
            widgetType={this.props.type}
          /> */}
          {/* without the wrapping div onClick events are triggered twice */}
          <>{this.renderChildren()}</>
        </VerticalLayoutComponent>
      </AutoLayoutContext.Provider>
    );
  }

  static getWidgetType(): string {
    return "VERTICALLAYOUT_WIDGET";
  }
}

export interface VerticalLayoutWidgetProps<T extends WidgetProps>
  extends WidgetProps {
  children?: T[];
  containerStyle?: ContainerStyle;
  shouldScrollContents?: boolean;
  noPad?: boolean;
}

export default VerticalLayoutWidget;
