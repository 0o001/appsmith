import type { FlexLayer } from "./autoLayoutTypes";
import type {
  FlattenedWidgetProps,
  CanvasWidgetsReduxState,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { generateReactKey } from "utils/generators";
import { updateRelationships } from "./autoLayoutDraggingUtils";
import type { CanvasSplitTypes } from "./canvasSplitProperties";
import { ResponsiveBehavior } from "./constants";
import { updateWidgetPositions } from "./positionUtils";
import { getUpdateDslAfterCreatingChild } from "sagas/WidgetAdditionSagas";
import { call } from "redux-saga/effects";

/**
 * Add a new canvas within the given parent.
 * -> reduce the width of the current canvas to half.
 * -> create a payload for creating a new canvas.
 * @param allWidgets | CanvasWidgetsReduxState : all widgets in the canvas
 * @param parentId | string : parent widget.
 * @param canvasSplitTypes | CanvasSplitTypes : type of canvas split
 * @returns CanvasWidgetsReduxState
 */
export function* addNewCanvas(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  ratios: number[],
  canvasSplitType: CanvasSplitTypes,
) {
  if (!parentId) return allWidgets;
  const parent = allWidgets[parentId];
  if (!parent || !parent.children) return allWidgets;

  /**
   * Assuming that canvas split introduces at max 1 new canvas,
   * then the existing canvas is used as a reference to add / delete the new canvas.
   */
  const existingCanvasId: string = parent.children[0];
  let existingCanvas: FlattenedWidgetProps = allWidgets[existingCanvasId];

  /**
   * Shrink the existing canvas.
   */
  const existingCanvasWidth =
    existingCanvas.rightColumn - existingCanvas.leftColumn;
  existingCanvas = {
    ...existingCanvas,
    rightColumn: existingCanvas.leftColumn + existingCanvasWidth * ratios[0],
    canvasSplitRatio: ratios[0],
  };

  /**
   * Create a new canvas.
   */
  const newCanvasId = generateReactKey();

  const newCanvasPayload: any = {
    widgetId: parentId,
    type: "CANVAS_WIDGET",
    leftColumn: existingCanvas.rightColumn,
    topRow: 0,
    columns: existingCanvasWidth * ratios[1],
    rows: existingCanvas.bottomRow - existingCanvas.topRow,
    canExtend: true,
    parentRowSpace: 1,
    parentColumnSpace: 1,
    responsiveBehavior: ResponsiveBehavior.Fill,
    newWidgetId: newCanvasId,
    props: {
      canvasSplitRatio: ratios[1],
    },
  };

  const widgetsAfterAddingNewCanvas: CanvasWidgetsReduxState = yield call(
    getUpdateDslAfterCreatingChild,
    newCanvasPayload,
  );

  return {
    ...widgetsAfterAddingNewCanvas,
    [existingCanvasId]: existingCanvas,
    [parentId]: {
      ...widgetsAfterAddingNewCanvas[parentId],
      canvasSplitType,
      ratios,
    },
  };
}

/**
 * if canvasSplitType is 1-column, then delete the second canvas.
 * and update the size of the remaining canvas.
 * @param allWidgets | CanvasWidgetsReduxState : all widgets in the canvas
 * @param parentId | string : parent widget.
 * @param canvasSplitType | CanvasSplitTypes : type of canvas split
 * @param isMobile | boolean : is mobile view
 * @returns CanvasWidgetsReduxState
 */
export function deleteCanvas(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  canvasSplitType: CanvasSplitTypes,
  isMobile: boolean,
  mainCanvasWidth: number,
): CanvasWidgetsReduxState {
  if (!parentId) return allWidgets;
  let widgets = { ...allWidgets };
  const parent = widgets[parentId];
  // if there is only one canvas, then do nothing.
  if (!parent || !parent.children || parent.children.length === 1)
    return widgets;

  /**
   * Assuming that canvas split introduces at max 1 new canvas,
   * then the existing canvas is used as a reference to add / delete the new canvas.
   */
  const remainingCanvasId: string = parent.children[0];
  let remainingCanvas: FlattenedWidgetProps = widgets[remainingCanvasId];

  /**
   * Delete the second canvas.
   */
  const selectedCanvasId: string = parent.children[1];
  const selectedCanvas: FlattenedWidgetProps = widgets[selectedCanvasId];
  const selectedChildren: string[] = selectedCanvas.children || [];
  const selectedFlexLayers: FlexLayer[] = selectedCanvas.flexLayers || [];
  widgets = updateRelationships(
    selectedChildren,
    widgets,
    remainingCanvasId,
    false,
    isMobile,
    mainCanvasWidth,
  );
  delete widgets[selectedCanvasId];

  /**
   * Expand the remaining canvas.
   */
  const remainingCanvasWidth =
    remainingCanvas.rightColumn - remainingCanvas.leftColumn;

  remainingCanvas = {
    ...remainingCanvas,
    rightColumn: remainingCanvas.leftColumn + remainingCanvasWidth * 2,
    flexLayers: [...(remainingCanvas.flexLayers || []), ...selectedFlexLayers],
    children: [...(remainingCanvas.children || []), ...selectedChildren],
    canvasSplitRatio: 1,
  };

  widgets = {
    ...widgets,
    [remainingCanvasId]: remainingCanvas,
    [parentId]: {
      ...parent,
      children: [remainingCanvasId],
      canvasSplitType,
      ratios: [1],
    },
  };

  widgets = updateWidgetPositions(
    widgets,
    remainingCanvasId,
    isMobile,
    mainCanvasWidth,
    false,
  );

  return widgets;
}

/**
 * If the split ratio is changed, then update the size of each canvas accordingly.
 * @param allWidgets | CanvasWidgetsReduxState : all widgets in the canvas
 * @param parentId | string : parent widget.
 * @param ratios | number[] : ratios of the split.
 * @param canvasSplitType | CanvasSplitTypes : type of canvas split
 * @returns CanvasWidgetsReduxState
 */
export function* updateCanvasSize(
  allWidgets: CanvasWidgetsReduxState,
  parentId: string,
  ratios: number[],
  canvasSplitType: CanvasSplitTypes,
  keepOriginalRatios: boolean,
) {
  if (!parentId) return allWidgets;
  const parent = allWidgets[parentId];
  if (!parent || !parent.children) return allWidgets;

  const updatedRatios =
    canvasSplitType === "2-column-custom" && keepOriginalRatios
      ? parent.ratios
      : ratios; // if the parent has only one child, then add a new canvas.
  if (parent.children.length < ratios.length) {
    const updatedWidgets: CanvasWidgetsReduxState = yield call(
      addNewCanvas,
      allWidgets,
      parentId,
      updatedRatios,
      canvasSplitType,
    );
    return updatedWidgets;
  }

  const firstCanvas = allWidgets[parent.children[0]];
  const secondCanvas = allWidgets[parent.children[1]];
  const finalRightColumn = secondCanvas.rightColumn;

  return {
    ...allWidgets,
    [firstCanvas.widgetId]: {
      ...firstCanvas,
      rightColumn: ratios[0] * finalRightColumn,
      canvasSplitRatio: ratios[0],
    },
    [secondCanvas.widgetId]: {
      ...secondCanvas,
      leftColumn: ratios[0] * finalRightColumn,
      canvasSplitRatio: ratios[1],
    },
    [parentId]: {
      ...parent,
      ratios: updatedRatios,
      canvasSplitType,
    },
  };
}
