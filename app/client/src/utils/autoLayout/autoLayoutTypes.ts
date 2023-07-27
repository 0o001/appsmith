import type { FlattenedWidgetProps } from "widgets/constants";
import type { FlexLayerAlignment } from "./constants";
import type { ReactNode } from "react";
import type { ContainerWidgetProps } from "widgets/ContainerWidget/widget";
import type { WidgetProps } from "widgets/BaseWidget";

export type AlignmentColumnInfo = {
  [key in FlexLayerAlignment]: number;
};

export type FlexBoxAlignmentColumnInfo = {
  [key: number]: AlignmentColumnInfo;
};

export type AlignmentColumnData = {
  alignment: FlexLayerAlignment;
  columns: number;
};

export interface LayerChild {
  id: string;
  align: FlexLayerAlignment;
}

export interface FlexLayer {
  children: LayerChild[];
}

export interface FlexLayerLayoutData {
  centerChildren: ReactNode[];
  endChildren: ReactNode[];
  hasFillWidget: boolean;
  startChildren: ReactNode[];
}

export interface DropZone {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

export interface HighlightInfo {
  isNewLayer: boolean; // determines if a new layer / child has been added directly to the container.
  index: number; // index of the child in props.children.
  layerIndex: number; // index of layer in props.flexLayers.
  rowIndex: number; // index of highlight within a horizontal layer.
  alignment: FlexLayerAlignment; // alignment of the child in the layer.
  posX: number; // x position of the highlight.
  posY: number; // y position of the highlight.
  width: number; // width of the highlight.
  height: number; // height of the highlight.
  isVertical: boolean; // determines if the highlight is vertical or horizontal.
  canvasId: string; // widgetId of the canvas to which the highlight belongs.
  dropZone: DropZone; // size of the drop zone of this highlight.
  layoutId: string; // layoutId of the layout to which the highlight belongs.
}

/**
 * Start: Position utils types
 */

export interface AlignmentChildren {
  widget: FlattenedWidgetProps;
  columns: number;
  rows: number;
}

export interface HighlightsAlignmentChildren {
  widget: FlattenedWidgetProps;
  height: number;
  width: number;
}

export interface AlignmentInfo {
  alignment: FlexLayerAlignment;
  width: number;
  children: HighlightsAlignmentChildren[];
}

export interface PositionsAlignmentInfo {
  alignment: FlexLayerAlignment;
  columns: number;
  children: AlignmentChildren[];
}

export interface Row extends PositionsAlignmentInfo {
  height: number;
}

/**
 * End: Position utils types
 */

export interface LayoutComponentProps {
  layoutId: string;
  layoutStyle?: { [key: string]: string | number | number[] | string[] };
  layoutType: string;
  layout: LayoutComponentProps[] | string[] | string[][];
  isDropTarget?: boolean;
  rendersWidgets?: boolean;
  widgetsAllowed?: string[];
  childTemplate?: LayoutComponentProps;
  insertChild?: boolean;

  childrenMap?: { [id: string]: JSX.Element | ReactNode };
  containerProps?: ContainerWidgetProps<WidgetProps> & {
    snapRows: number;
    snapSpaces: any;
  };
}
