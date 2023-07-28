/* eslint-disable no-console */
import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import {
  getPositionOfFocusedWidget,
  getPositionOfSelectedWidget,
} from "selectors/entitiesSelector";
import { throttle } from "lodash";
import { Layer, Stage } from "react-konva";
import Konva from "konva";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { useAutoLayoutResizable } from "./useAutoLayoutResizable";
import type { AppState } from "@appsmith/reducers";
import { ReflowDirection } from "reflow/reflowTypes";

const OVERLAY_CANVAS_ID = "overlay-canvas";
const FONT_SIZE = 14;
const LINE_HEIGHT = Math.floor(FONT_SIZE * 1.2);
const VERTICAL_PADDING = 4;
const HORIZONTAL_PADDING = 6;
const HANDLE_MAX_DIMENSION = 16;
const HANDLE_MIN_DIMENSION = 8;

const HEIGHT = Math.floor(LINE_HEIGHT + VERTICAL_PADDING * 1.5);

const FILL_COLOR = "rgb(239, 117, 65)";
const TEXT_COLOR = "rgb(255, 255, 255)";

const OverlayCanvasContainer = (props: {
  canvasWidth: number;
  containerRef: React.RefObject<HTMLDivElement>;
  parentRef: React.RefObject<HTMLDivElement>;
}) => {
  const selectedWidgetsData:
    | { id: string; widgetName: string; position: any }[]
    | undefined = useSelector(getPositionOfSelectedWidget);

  const focusedWidgetData:
    | { id: string; widgetName: string; position: any }
    | undefined = useSelector(getPositionOfFocusedWidget);
  const canvasRef = useRef<HTMLDivElement>(null);

  const isAutoCanvasResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );

  const widgetNamePositions = useRef<
    | { left: number; top: number; height: number; text: string; width: number }
    | undefined
  >(undefined);

  const hoveredHandle = useRef<ReflowDirection | undefined>(undefined);

  const canvasPositions = useRef<{
    top: number;
    left: number;
    xDiff: number;
    width: number;
    yDiff: number;
    height: number;
  }>({
    top: 0,
    left: 0,
    xDiff: 0,
    width: 0,
    yDiff: 0,
    height: 0,
  });
  const canvasPositionUpdated = useRef<boolean>(false);
  const containerEventAdded = useRef<boolean>(false);

  const scrollTop = useRef<number>(0);
  const isScrolling = useRef(0);
  const hasScroll = useRef<boolean>(false);
  const stageRef = useRef<any>(null);

  const { selectWidget } = useWidgetSelection();

  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );

  useEffect(() => {
    if (!canvasRef?.current) return;
    if (canvasPositionUpdated.current) return;
    const canvas: HTMLDivElement = canvasRef?.current as HTMLDivElement;
    const rect: DOMRect = canvas.getBoundingClientRect();
    if (rect) {
      canvasPositions.current = {
        ...canvasPositions.current,
        height: rect.height + rect.top,
        left: rect.left,
        top: rect.top,
        width: rect.width,
      };
      canvasPositionUpdated.current = true;
    }
  }, [canvasRef?.current]);

  const getPositionsForBoundary = (position: any) => {
    const { left: parentLeft = 0, top: parentTop = 0 } =
      props.parentRef?.current?.getBoundingClientRect() || {};
    const { left: canvasLeft = 0, top: canvasTop = 0 } =
      stageRef?.current?.content?.getBoundingClientRect() || {};

    const leftOffset = parentLeft - canvasLeft;
    const topOffset = parentTop - canvasTop;

    canvasPositions.current = {
      ...canvasPositions.current,
      xDiff: leftOffset,
      yDiff: topOffset,
    };

    const left: number = position.left + leftOffset;
    const top: number = position.top + topOffset - scrollTop.current;

    return { left, top };
  };

  const getWidgetBoundary = (
    position: any,
    positionForBoundary: { left: number; top: number },
    hasWidgetName: boolean,
  ) => {
    const { left, top } = positionForBoundary;

    const groupEl = new Konva.Group({
      height: position.height,
      width: position.width,
      x: left,
      y: top,
    });

    const rectEl = new Konva.Rect({
      cornerRadius: [4, hasWidgetName ? 0 : 4, 4, 4],
      stroke: FILL_COLOR,
      strokeWidth: 1,
      height: position.height,
      width: position.width,
      x: 0,
      y: 0,
    });

    groupEl.add(rectEl);

    return groupEl;
  };

  const getWidgetResizeHandles = (
    position: any,
    positionForBoundary: { left: number; top: number },
  ) => {
    const { left, top } = positionForBoundary;

    const handleGroups: Konva.Group[] = [];

    if (handlePositions[ReflowDirection.BOTTOM]) {
      const groupEl = new Konva.Group({
        height: HANDLE_MIN_DIMENSION,
        width: HANDLE_MAX_DIMENSION,
        x: left + position.width / 2 - HANDLE_MAX_DIMENSION / 2,
        y: top + position.height - HANDLE_MIN_DIMENSION / 2,
      });

      const outerBorderRadius = HANDLE_MIN_DIMENSION / 2;
      const rectEl = new Konva.Rect({
        cornerRadius: [
          outerBorderRadius,
          outerBorderRadius,
          outerBorderRadius,
          outerBorderRadius,
        ],
        fill: "white",
        height: HANDLE_MIN_DIMENSION + 2,
        width: HANDLE_MAX_DIMENSION + 2,
        x: 0,
        y: 0,
      });

      groupEl.add(rectEl);

      const innerBorderRadius = HANDLE_MIN_DIMENSION / 2;
      const rectEl2 = new Konva.Rect({
        cornerRadius: [
          innerBorderRadius,
          innerBorderRadius,
          innerBorderRadius,
          innerBorderRadius,
        ],
        stroke: FILL_COLOR,
        strokeWidth: 1,
        fill:
          hoveredHandle.current &&
          hoveredHandle.current === ReflowDirection.BOTTOM
            ? FILL_COLOR
            : "white",
        height: HANDLE_MIN_DIMENSION,
        width: HANDLE_MAX_DIMENSION,
        x: 1,
        y: 1,
      });

      groupEl.add(rectEl2);

      handleGroups.push(groupEl);
    }

    if (handlePositions[ReflowDirection.LEFT]) {
      const groupEl = new Konva.Group({
        height: HANDLE_MAX_DIMENSION,
        width: HANDLE_MIN_DIMENSION,
        x: left - HANDLE_MIN_DIMENSION / 2 - 1,
        y: top + position.height / 2 - HANDLE_MAX_DIMENSION / 2,
      });

      const outerBorderRadius = HANDLE_MIN_DIMENSION / 2;
      const rectEl = new Konva.Rect({
        cornerRadius: [
          outerBorderRadius,
          outerBorderRadius,
          outerBorderRadius,
          outerBorderRadius,
        ],
        fill: "white",
        height: HANDLE_MAX_DIMENSION + 2,
        width: HANDLE_MIN_DIMENSION + 2,
        x: 0,
        y: 0,
      });

      groupEl.add(rectEl);

      const innerBorderRadius = HANDLE_MIN_DIMENSION / 2;
      const rectEl2 = new Konva.Rect({
        cornerRadius: [
          innerBorderRadius,
          innerBorderRadius,
          innerBorderRadius,
          innerBorderRadius,
        ],
        stroke: FILL_COLOR,
        fill:
          hoveredHandle.current &&
          hoveredHandle.current === ReflowDirection.LEFT
            ? FILL_COLOR
            : "white",
        strokeWidth: 1,
        height: HANDLE_MAX_DIMENSION,
        width: HANDLE_MIN_DIMENSION,
        x: 1,
        y: 1,
      });

      groupEl.add(rectEl2);

      handleGroups.push(groupEl);
    }

    if (handlePositions[ReflowDirection.RIGHT]) {
      const groupEl = new Konva.Group({
        height: HANDLE_MAX_DIMENSION,
        width: HANDLE_MIN_DIMENSION,
        x: left + position.width - HANDLE_MIN_DIMENSION / 2,
        y: top + position.height / 2 - HANDLE_MAX_DIMENSION / 2,
      });

      const outerBorderRadius = HANDLE_MIN_DIMENSION / 2;
      const rectEl = new Konva.Rect({
        cornerRadius: [
          outerBorderRadius,
          outerBorderRadius,
          outerBorderRadius,
          outerBorderRadius,
        ],
        fill: "white",
        height: HANDLE_MAX_DIMENSION + 2,
        width: HANDLE_MIN_DIMENSION + 2,
        x: 0,
        y: 0,
      });

      groupEl.add(rectEl);

      const innerBorderRadius = HANDLE_MIN_DIMENSION / 2;
      const rectEl2 = new Konva.Rect({
        cornerRadius: [
          innerBorderRadius,
          innerBorderRadius,
          innerBorderRadius,
          innerBorderRadius,
        ],
        stroke: FILL_COLOR,
        strokeWidth: 1,
        fill:
          hoveredHandle.current &&
          hoveredHandle.current === ReflowDirection.RIGHT
            ? FILL_COLOR
            : "white",
        height: HANDLE_MAX_DIMENSION,
        width: HANDLE_MIN_DIMENSION,
        x: 1,
        y: 1,
      });

      groupEl.add(rectEl2);

      handleGroups.push(groupEl);
    }

    return handleGroups;
  };

  const getWidgetNameComponent = (position: any, widgetName: string) => {
    const textEl = new Konva.Text({
      fill: TEXT_COLOR,
      fontFamily: "sans-serif",
      fontSize: FONT_SIZE,
      text: widgetName,
      x: HORIZONTAL_PADDING,
      y: VERTICAL_PADDING,
    });

    const textWidth: number = textEl.width();
    const componentWidth: number = textWidth + HORIZONTAL_PADDING * 2;

    const { left: widgetLeft, top: widgetTop } =
      getPositionsForBoundary(position);
    const left: number = widgetLeft + position.width - componentWidth + 0.5;
    const top: number = widgetTop - HEIGHT;
    widgetNamePositions.current = {
      left: left,
      text: widgetName,
      top: top,
      width: componentWidth,
      height: HEIGHT,
    };

    const groupEl = new Konva.Group({
      height: HEIGHT,
      width: componentWidth,
      x: left,
      y: top,
    });

    const rectEl = new Konva.Rect({
      cornerRadius: [4, 4, 0, 0],
      fill: FILL_COLOR,
      height: HEIGHT,
      width: componentWidth,
      x: 0,
      y: 0,
    });

    groupEl.add(rectEl);
    groupEl.add(textEl);

    return groupEl;
  };

  const addWidgetToCanvas = (
    layer: any,
    widgetId: string,
    position: any,
    widgetName?: string,
    shouldRenderHandles?: boolean,
  ) => {
    if (!position) return;

    if (widgetName) {
      const widgetNameComponent = getWidgetNameComponent(position, widgetName);

      widgetNameComponent.on("click", (event) => {
        console.log("#### click", event);
        selectWidget(SelectionRequestType.One, [widgetId]);
      });
      layer.add(widgetNameComponent);
    }

    const positionForBoundary = getPositionsForBoundary(position);
    const widgetBoundary = getWidgetBoundary(
      position,
      positionForBoundary,
      !!widgetName,
    );
    layer.add(widgetBoundary);

    if (shouldRenderHandles) {
      const widgetResizeHandles = getWidgetResizeHandles(
        position,
        positionForBoundary,
      );

      for (const resizeHandle of widgetResizeHandles) {
        layer.add(resizeHandle);
      }
    }
  };

  const updateSelectedWidgetPositions = (widgetPosition?: any) => {
    if (!stageRef?.current) return;

    const stage = stageRef.current;
    const layer = stage.getLayers()[0];
    layer.destroyChildren();

    if (selectedWidgetsData?.length) {
      const isSingleSelected = selectedWidgetsData.length === 1;
      for (const selectedWidget of selectedWidgetsData) {
        const {
          id,
          position: selectedWidgetPosition,
          widgetName,
        } = selectedWidget;

        if (isSingleSelected) {
          const position = widgetPosition || selectedWidgetPosition;

          addWidgetToCanvas(
            layer,
            selectedWidget.id,
            position,
            widgetName,
            true,
          );

          continue;
        }

        addWidgetToCanvas(layer, id, selectedWidgetPosition);
      }
    }

    if (focusedWidgetData) {
      const { id, position, widgetName } = focusedWidgetData;

      addWidgetToCanvas(layer, id, position, widgetName);
    }

    layer.draw();
  };

  const getScrollTop = () => {
    return props?.parentRef?.current?.scrollTop || 0;
  };

  const { handlePositions, onMouseDown, onMouseMove, onMouseUp } =
    useAutoLayoutResizable(
      selectedWidgetsData,
      canvasPositions.current,
      getScrollTop,
      getPositionsForBoundary,
      updateSelectedWidgetPositions,
    );

  const setHoveredHandle = (handleDirection: ReflowDirection | undefined) => {
    if (hoveredHandle.current !== handleDirection) {
      hoveredHandle.current = handleDirection;
    }
  };

  const handleMouseMove = throttle((e: any) => {
    const canvas = canvasRef?.current as HTMLDivElement;
    if (!canvas) return;
    const { cursor, handle, isMouseOver } = getMouseOverDetails(e);

    setHoveredHandle(handle);
    if (isMouseOver || isResizing) {
      if (canvas.style.pointerEvents === "none") {
        canvas.style.pointerEvents = "auto";
      }
    } else if (canvas.style.pointerEvents !== "none") {
      canvas.style.pointerEvents = "none";
      canvas.style.cursor = "default";
    }

    if (!cursor) {
      canvas.style.cursor = "default";
    } else if (canvas.style.cursor !== cursor) {
      canvas.style.cursor = cursor;
    }
  }, 20);

  const handleScroll = () => {
    if (!props.parentRef?.current) return;
    const currentScrollTop: number = props.parentRef?.current?.scrollTop;
    if (!isScrolling.current) {
      resetCanvas();
    }
    clearTimeout(isScrolling.current);
    isScrolling.current = setTimeout(() => {
      scrollTop.current = currentScrollTop;
      updateSelectedWidgetPositions();
      isScrolling.current = 0;
      if (
        (props.parentRef?.current?.scrollHeight || 0) >
        (props.parentRef?.current?.clientHeight || 0)
      )
        hasScroll.current = true;
    }, 100);
  };

  useEffect(() => {
    if (
      !props.containerRef?.current ||
      !props.parentRef?.current ||
      !canvasRef?.current ||
      containerEventAdded.current
    )
      return;
    const container: HTMLDivElement = props.containerRef
      ?.current as HTMLDivElement;
    const parent: HTMLDivElement = props.parentRef?.current as HTMLDivElement;
    container.addEventListener("mousemove", handleMouseMove);
    parent.addEventListener("scroll", handleScroll);
    containerEventAdded.current = true;
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      parent.removeEventListener("scroll", handleScroll);
      containerEventAdded.current = false;
    };
  }, [
    props.containerRef?.current,
    props.parentRef?.current,
    handlePositions,
    isResizing,
    hoveredHandle.current,
  ]);

  const getMouseOverDetails = (e: any) => {
    const x =
      e.clientX - canvasPositions.current.left - canvasPositions.current.xDiff;
    const y = e.clientY - canvasPositions.current.top;
    if (widgetNamePositions.current) {
      const { height, left, top, width } = widgetNamePositions.current;
      if (x > left && x < left + width && y > top && y < top + height) {
        return { isMouseOver: true, cursor: "pointer" };
      }
    }

    for (const handle of Object.values(handlePositions)) {
      const { height, left, top, width } = handle;
      if (x > left && x < left + width && y > top && y < top + height) {
        setHoveredHandle(handle.direction);
        return {
          isMouseOver: true,
          cursor: handle.cursor,
          handle: handle.direction,
        };
      }
    }

    return { isMouseOver: false };
  };

  useEffect(() => {
    if (!selectedWidgetsData?.length || isAutoCanvasResizing) {
      resetCanvas();
      return;
    }
    if (!isResizing) {
      updateSelectedWidgetPositions();
    }
  }, [
    selectedWidgetsData,
    focusedWidgetData,
    isResizing,
    handlePositions,
    isAutoCanvasResizing,
  ]);

  const resetCanvas = () => {
    widgetNamePositions.current = undefined;
    const stage = stageRef.current;
    if (!stage) return;
    const layer = stage.getLayers()[0];
    if (!layer) return;
    layer.destroyChildren();
    layer.draw();
  };

  return (
    <div
      id={OVERLAY_CANVAS_ID}
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 2,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        height: "100%",
      }}
    >
      <Stage
        height={canvasPositions?.current.height || 600}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        ref={stageRef}
        width={props.canvasWidth + 20}
      >
        <Layer />
      </Stage>
    </div>
  );
};

export default OverlayCanvasContainer;
