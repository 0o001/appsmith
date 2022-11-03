import { getWidgets } from "sagas/selectors";
import { useSelector } from "store";

import {
  FlexLayerAlignment,
  LayoutDirection,
  ResponsiveBehavior,
} from "components/constants";
import {
  FlexLayer,
  LayerChild,
} from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
// import { useDispatch } from "react-redux";
import { ReflowDirection } from "reflow/reflowTypes";
import { DRAG_MARGIN } from "widgets/constants";
import { WidgetDraggingBlock } from "./useBlocksToBeDraggedOnCanvas";

interface XYCord {
  x: number;
  y: number;
}

export interface HighlightInfo {
  isNewLayer: boolean; // determines if a new layer / child has been added directly to the container.
  index: number; // index of the child in props.children.
  layerIndex?: number; // index of layer in props.flexLayers.
  rowIndex?: number; // index of highlight within a horizontal layer.
  alignment: FlexLayerAlignment; // alignment of the child in the layer.
  posX: number; // x position of the highlight.
  posY: number; // y position of the highlight.
  width: number; // width of the highlight.
  height: number; // height of the highlight.
  isVertical: boolean; // determines if the highlight is vertical or horizontal.
}

export interface AutoLayoutHighlightProps {
  blocksToDraw: WidgetDraggingBlock[];
  canvasId: string;
  direction?: LayoutDirection;
  dropPositionRef: React.RefObject<HTMLDivElement>;
  isCurrentDraggedCanvas: boolean;
  isDragging: boolean;
  useAutoLayout?: boolean;
}

export interface HighlightSelectionPayload {
  highlights: HighlightInfo[];
  selectedHighlight: HighlightInfo;
}

const OFFSET_WIDTH = 4;

export const useAutoLayoutHighlights = ({
  blocksToDraw,
  canvasId,
  direction,
  dropPositionRef,
  isCurrentDraggedCanvas,
  isDragging,
  useAutoLayout,
}: AutoLayoutHighlightProps) => {
  const allWidgets = useSelector(getWidgets);
  const canvas = allWidgets[canvasId];
  const layers: FlexLayer[] = canvas?.flexLayers || [];
  const isVertical = direction === LayoutDirection.Vertical;
  // const dispatch = useDispatch();
  let highlights: HighlightInfo[] = [];
  let lastActiveHighlight: HighlightInfo | undefined;
  let containerDimensions: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    width: number;
    height: number;
  };

  /**
   * START AUTO LAYOUT OFFSET CALCULATION
   */

  // Fetch and update the dimensions of the containing canvas.
  const updateContainerDimensions = (): boolean => {
    const container = document.querySelector(`.appsmith_widget_${canvasId}`);
    const containerRect:
      | DOMRect
      | undefined = container?.getBoundingClientRect();
    if (!container || !containerRect) return false;
    containerDimensions = {
      top: containerRect?.top || 0,
      bottom: containerRect?.bottom - containerDimensions?.top || 0,
      left: containerRect?.left || 0,
      right: containerRect?.right - containerRect?.left || 0,
      width: containerRect?.width,
      height: containerRect?.height,
    };
    return true;
  };

  const getContainerDimensionsAsDomRect = (): DOMRect => {
    if (!containerDimensions) updateContainerDimensions();
    return {
      x: containerDimensions?.left,
      y: containerDimensions?.top,
      width: containerDimensions?.width,
      height: containerDimensions?.height,
    } as DOMRect;
  };

  // Get DOM element for a given widgetId
  const getDomElement = (widgetId: string): any =>
    document.querySelector(`.auto-layout-child-${widgetId}`);

  const cleanUpTempStyles = () => {
    // reset display of all dragged blocks
    const els = document.querySelectorAll(`.auto-layout-parent-${canvasId}`);
    if (els && els.length) {
      els.forEach((el) => {
        (el as any).classList.remove("auto-temp-no-display");
        (el as any).style.transform = null;
      });
    }

    // reset state
    lastActiveHighlight = undefined;
    highlights = [];
    // Hide the highlight
    if (dropPositionRef && dropPositionRef.current) {
      dropPositionRef.current.style.opacity = "0";
      dropPositionRef.current.style.display = "none";
    }
  };

  // Get a list of widgetIds that are being dragged.
  const getDraggedBlocks = (): string[] => {
    const blocks = blocksToDraw.map((block) => block.widgetId);
    return blocks;
  };

  // Hide the dragged children of the auto layout container
  // to discount them from highlight calculation.
  // const hideDraggedItems = (draggedBlocks: string[]): void => {
  //   draggedBlocks.forEach((id: string) => {
  //     const el = getDomElement(id);
  //     if (el) {
  //       el.classList.add("auto-temp-no-display");
  //     }
  //   });
  // };
  const getDropPositions = () => {
    const els = document.querySelectorAll(`.t--drop-position-${canvasId}`);
    const highlights: HighlightInfo[] = [];
    for (const el of els) {
      const rect: DOMRect = el.getBoundingClientRect();
      const classList = Array.from(el.classList);

      const highlight: HighlightInfo = classList.reduce(
        (acc: HighlightInfo, curr) => {
          if (curr.indexOf("alignment") > -1)
            acc.alignment = curr.split("-")[1] as FlexLayerAlignment;
          else if (curr.indexOf("layer-index") > -1)
            acc.layerIndex = parseInt(curr.split("layer-index-")[1]);
          else if (curr.indexOf("child-index") > -1)
            acc.index = parseInt(curr.split("child-index-")[1]);
          else if (curr.indexOf("isNewLayer") > -1) acc.isNewLayer = true;
          else if (curr.indexOf("isVertical") > -1) acc.isVertical = true;

          return acc;
        },
        {
          isNewLayer: false,
          index: 0,
          layerIndex: 0,
          alignment: FlexLayerAlignment.Start,
          posX: rect.x - containerDimensions.left,
          posY: rect.y - containerDimensions?.top,
          width: rect.width,
          height: rect.height,
          isVertical: false,
        },
      );
      highlights.push(highlight);
    }

    return highlights;
  };

  const calculateHighlights = (): HighlightInfo[] => {
    /**
     * 1. Clean up temp styles.
     * 2. Get the dragged blocks.
     * 3. Discount dragged blocks and empty layers from the calculation.
     * 4. hide the dragged blocks and empty layers.
     */
    cleanUpTempStyles();
    if (useAutoLayout && isDragging && isCurrentDraggedCanvas) {
      const draggedBlocks = getDraggedBlocks();
      if (!draggedBlocks || !draggedBlocks.length) return [];
      /**
       * update dimensions of the current canvas
       * and break out of the function if returned value is false.
       * That implies the container is null.
       */
      if (!updateContainerDimensions()) return [];
      // hideDraggedItems(draggedBlocks);
      getDropPositions();
      const canvasChildren = canvas.children || [];
      // Get the list of children that are not being dragged.
      const offsetChildren = canvasChildren.filter((each) => {
        return draggedBlocks.indexOf(each) === -1;
      });

      if (isVertical) {
        highlights = getDropPositions();
      } else {
        highlights = calculateRowHighlights(
          offsetChildren,
          0,
          0,
          FlexLayerAlignment.Start,
          getContainerDimensionsAsDomRect(),
          true,
        );
      }
    }
    // console.log("#### highlights", highlights);
    return highlights;
  };

  // Remove dragged blocks from the list of children and update hasChild.
  function filterLayer(layer: FlexLayer, offsetChildren: string[]): FlexLayer {
    const filteredChildren = layer.children?.filter(
      (child: LayerChild) => offsetChildren.indexOf(child.id) !== -1,
    );
    return {
      ...layer,
      children: filteredChildren,
      hasFillChild: filteredChildren?.some(
        (each) =>
          allWidgets[each.id]?.responsiveBehavior === ResponsiveBehavior.Fill,
      ),
    };
  }

  function calculateVerticalStackHighlights(
    flexLayers: FlexLayer[],
    offsetChildren: string[],
  ): HighlightInfo[] {
    // If container is empty, return a highlight for the first position.
    if (!flexLayers || !flexLayers.length)
      return [
        getInitialHighlight(
          0,
          FlexLayerAlignment.Start,
          0,
          getContainerDimensionsAsDomRect(),
          LayoutDirection.Vertical,
          true,
        ),
      ];

    let childCount = 0;
    let discardedLayers = 0;
    let index = 0;
    const arr: HighlightInfo[] = [];
    const rects: DOMRect[] = [];
    // TODO: add documentation for the updated logic.
    for (const layer of flexLayers) {
      // remove dragged blocks from the layer
      const filteredLayer = filterLayer(layer, offsetChildren);
      const isEmpty = !filteredLayer.children.length;
      // if (isEmpty) {
      //   discardedLayers += 1;
      //   // index += 1;
      //   // continue;
      // }
      const el = document.querySelector(
        `.auto-layout-layer-${canvasId}-${index}`,
      );
      if (!el) {
        discardedLayers += 1;
        index += 1;
        continue;
      }
      const rect: DOMRect = el.getBoundingClientRect();
      // Add a horizontal highlight if the layer is not empty.
      if (!isEmpty) {
        rects.push(rect);
        const info: HighlightInfo = {
          isNewLayer: true,
          index: childCount,
          layerIndex: index - discardedLayers,
          posX: 0,
          posY: Math.max(rect.y - containerDimensions?.top - 4, 0),
          width: containerDimensions?.width,
          height: OFFSET_WIDTH,
          alignment: FlexLayerAlignment.Start,
          isVertical: false,
        };
        // Add the horizontal highlight before the layer.
        arr.push(info);
      }
      // Add vertical highlights for each child in the layer.
      arr.push(
        ...generateHighlightsForLayer(
          filteredLayer,
          index - discardedLayers,
          rect,
          childCount,
        ),
      );
      if (isEmpty) discardedLayers += 1;
      index += 1;
      childCount += filteredLayer.children?.length || 0;
    }

    // Add a highlight for the last position.
    const lastRect: DOMRect = rects[rects.length - 1];
    arr.push({
      isNewLayer: true,
      index: childCount,
      layerIndex: rects.length,
      posX: 0,
      posY: lastRect?.y + lastRect?.height - containerDimensions?.top,
      width: containerDimensions?.width,
      height: OFFSET_WIDTH,
      alignment: FlexLayerAlignment.Start,
      isVertical: false,
    });

    return arr;
  }

  // Extract start, center and end children from the layer.
  function spreadLayer(layer: FlexLayer) {
    // const draggedBlocks = getDraggedBlocks();
    const start: string[] = [],
      center: string[] = [],
      end: string[] = [];
    layer.children.forEach((child: LayerChild) => {
      // if (draggedBlocks.includes(child.id)) return;
      if (layer.hasFillChild) {
        start.push(child.id);
        return;
      }
      if (child.align === FlexLayerAlignment.End) end.push(child.id);
      else if (child.align === FlexLayerAlignment.Center) center.push(child.id);
      else start.push(child.id);
    });
    return {
      start,
      center,
      end,
      hasFillChild: layer.hasFillChild,
      isEmpty: !start.length && !center.length && !end.length,
    };
  }

  function generateHighlightsForLayer(
    layer: FlexLayer,
    layerIndex: number,
    layerRect: DOMRect,
    childCount: number,
  ): HighlightInfo[] {
    const arr: HighlightInfo[] = [];
    let curr: number = childCount;
    const { center, end, hasFillChild, isEmpty, start } = spreadLayer(layer);

    const startHighLights = calculateRowHighlights(
      start,
      curr,
      layerIndex,
      FlexLayerAlignment.Start,
      layerRect,
      isEmpty,
    );

    // process start sub wrapper.
    arr.push(...startHighLights);
    if (!hasFillChild) {
      // process center sub wrapper.
      curr += start.length;
      const centerHighlights = calculateRowHighlights(
        center,
        curr,
        layerIndex,
        FlexLayerAlignment.Center,
        layerRect,
        isEmpty,
      );

      // process end sub wrapper.
      curr += center.length;
      //ToDo(Ashok and Preet): we need a better way to decide how to filter out highlights
      // for now i am filtering highlights to not overlap with each other.
      const endHighLights = calculateRowHighlights(
        end,
        curr,
        layerIndex,
        FlexLayerAlignment.End,
        layerRect,
        isEmpty,
      );
      const validEndHighLights = endHighLights.filter((each) => {
        return !startHighLights.some((eachHighlight) => {
          return eachHighlight.posX > each.posX;
        });
      });
      arr.push(...validEndHighLights);
      const validCenteredHighlights = centerHighlights.filter((each) => {
        return (
          !startHighLights.length ||
          !endHighLights.length ||
          !(
            startHighLights.some((eachHighlight) => {
              return eachHighlight.posX > each.posX;
            }) ||
            endHighLights.some((eachHighlight) => {
              return eachHighlight.posX < each.posX;
            })
          )
        );
      });
      arr.push(...validCenteredHighlights);
    }
    return arr;
  }

  function calculateRowHighlights(
    children: string[],
    childCount: number,
    layerIndex: number,
    align: FlexLayerAlignment,
    layerRect: DOMRect,
    isNewLayer = false,
  ): HighlightInfo[] {
    if (!children || !children.length)
      return [
        getInitialHighlight(
          childCount,
          align,
          layerIndex,
          layerRect,
          LayoutDirection.Horizontal,
          isNewLayer,
        ),
      ];
    return getRowHighlights(children, align, layerIndex, childCount);
  }

  // Initial highlight for an empty container or layer.
  function getInitialHighlight(
    childCount: number,
    alignment: FlexLayerAlignment,
    layerIndex: number,
    rect: DOMRect,
    direction: LayoutDirection,
    isNewLayer = false,
  ): HighlightInfo {
    const verticalFlex = direction === LayoutDirection.Vertical;
    return {
      isNewLayer,
      index: childCount,
      layerIndex,
      alignment,
      posX:
        alignment === FlexLayerAlignment.Start
          ? 0
          : alignment === FlexLayerAlignment.Center
          ? containerDimensions.width / 2
          : containerDimensions?.width - DRAG_MARGIN * 2,
      posY:
        rect.y - containerDimensions?.top + (verticalFlex ? 0 : DRAG_MARGIN),
      width: verticalFlex ? rect?.width : OFFSET_WIDTH,
      height: verticalFlex ? OFFSET_WIDTH : rect.height - DRAG_MARGIN * 2,
      isVertical: !verticalFlex,
      rowIndex: 0,
    };
  }

  function getRowHighlights(
    children: string[], // Children of the row flex.
    alignment: FlexLayerAlignment, // alignment for the highlights.
    layerIndex: number, // index of the row flex.
    childCount: number, // index of the first child.
  ): HighlightInfo[] {
    const arr: HighlightInfo[] = [];
    const childRects: DOMRect[] = [];
    let index = childCount;
    let rowIndex = 0;
    for (const child of children) {
      const el = getDomElement(child);
      if (!el) continue;
      const childRect: DOMRect = el?.getBoundingClientRect();
      childRects.push(childRect);
      // A highlight before each existing child.
      arr.push({
        isNewLayer: false,
        index,
        layerIndex,
        alignment,
        posX: Math.max(childRect?.x - containerDimensions?.left - 8, 0),
        posY: childRect?.y - containerDimensions?.top,
        width: OFFSET_WIDTH,
        height: childRect?.height,
        isVertical: true,
        rowIndex,
      });
      index += 1;
      rowIndex += 1;
    }

    // A highlight after the last child.
    const lastRect: DOMRect = childRects[childRects.length - 1];
    arr.push({
      isNewLayer: false,
      index,
      layerIndex,
      alignment,
      posX: lastRect?.x + lastRect?.width - containerDimensions?.left,
      posY: lastRect?.y - containerDimensions?.top,
      width: OFFSET_WIDTH,
      height: lastRect?.height,
      isVertical: true,
      rowIndex,
    });
    return arr;
  }

  /**
   * END AUTO LAYOUT OFFSET CALCULATION
   */

  // const debouncedDispatch = debounce((pos: HighlightInfo) => {
  //   dispatchTempHighlight(pos);
  // }, 5);

  // const setTempHighlight = (pos: HighlightInfo) => {
  //   dispatch({
  //     type: ReduxActionTypes.SELECT_AUTOLAYOUT_HIGHLIGHT,
  //     payload: {
  //       flexHighlight: pos,
  //       blocksToDraw,
  //     },
  //   });
  // };

  // const clearTempHighlight = () => {
  //   dispatch({
  //     type: ReduxActionTypes.CLEAR_HIGHLIGHT_SELECTION,
  //   });
  // };

  const highlightDropPosition = (
    e: any,
    moveDirection: ReflowDirection,
    // acceleration: number,
  ): HighlightSelectionPayload | undefined => {
    if (!highlights) return;
    const payload: HighlightSelectionPayload = getHighlightPayload(
      e,
      moveDirection,
    );

    if (!payload || !payload.selectedHighlight) return;
    lastActiveHighlight = payload.selectedHighlight;
    return payload;
  };

  const getHighlightPayload = (
    e: any,
    moveDirection?: ReflowDirection,
    val?: XYCord,
  ): HighlightSelectionPayload => {
    let base: HighlightInfo[] = [];
    if (!highlights || !highlights.length)
      highlights = [
        getInitialHighlight(
          0,
          FlexLayerAlignment.Start,
          0,
          getContainerDimensionsAsDomRect(),
          direction || LayoutDirection.Vertical,
          true,
        ),
      ];
    base = highlights;

    const pos: XYCord = {
      x: e?.offsetX || val?.x,
      y: e?.offsetY || val?.y,
    };

    const filteredHighlights: HighlightInfo[] = getViableDropPositions(
      base,
      pos,
      moveDirection,
    );
    // console.log("#### filteredHighlights: ", filteredHighlights, base);
    const arr = filteredHighlights.sort((a, b) => {
      return (
        calculateDistance(a, pos, moveDirection) -
        calculateDistance(b, pos, moveDirection)
      );
    });

    return { highlights: [...arr.slice(1)], selectedHighlight: arr[0] };
  };

  function getViableDropPositions(
    arr: HighlightInfo[],
    pos: XYCord,
    moveDirection?: ReflowDirection,
  ): HighlightInfo[] {
    if (!moveDirection || !arr) return arr || [];
    const isVerticalDrag = [
      ReflowDirection.TOP,
      ReflowDirection.BOTTOM,
    ].includes(moveDirection);
    return direction === LayoutDirection.Vertical
      ? getVerticalStackDropPositions(arr, pos, isVerticalDrag)
      : getHorizontalStackDropPositions(arr, pos);
  }

  function getVerticalStackDropPositions(
    arr: HighlightInfo[],
    pos: XYCord,
    isVerticalDrag: boolean,
  ): HighlightInfo[] {
    // For vertical stacks, filter out the highlights based on drag direction and y position.
    let filteredHighlights: HighlightInfo[] = arr.filter(
      (highlight: HighlightInfo) => {
        // Return only horizontal highlights for vertical drag.
        if (isVerticalDrag) return !highlight.isVertical;
        // Return only vertical highlights for horizontal drag, if they lie in the same x plane.
        return (
          highlight.isVertical &&
          pos.y >= highlight.posY &&
          pos.y <= highlight.posY + highlight.height
        );
      },
    );
    // console.log("#### pos", arr, filteredHighlights, isVerticalDrag);
    // For horizontal drag, if no vertical highlight exists in the same x plane,
    // return the last horizontal highlight.
    if (!isVerticalDrag && !filteredHighlights.length) {
      const horizontalHighlights = arr.filter(
        (highlight: HighlightInfo) => !highlight.isVertical,
      );
      filteredHighlights = [
        horizontalHighlights[horizontalHighlights.length - 1],
      ];
    }
    return filteredHighlights;
  }

  function getHorizontalStackDropPositions(
    arr: HighlightInfo[],
    pos: XYCord,
  ): HighlightInfo[] {
    // For horizontal stack, return the highlights that lie in the same x plane.
    let filteredHighlights = arr.filter(
      (highlight) =>
        pos.y >= highlight.posY && pos.y <= highlight.posY + highlight.height,
    );
    // If no highlight exists in the same x plane, return the last highlight.
    if (!filteredHighlights.length) filteredHighlights = [arr[arr.length - 1]];
    return filteredHighlights;
  }

  const calculateDistance = (
    a: HighlightInfo,
    b: XYCord,
    moveDirection?: ReflowDirection,
  ): number => {
    /**
     * Calculate perpendicular distance of a point from a line.
     * If moving vertically, x is fixed (x = 0) and vice versa.
     */
    const isVerticalDrag =
      moveDirection &&
      [ReflowDirection.TOP, ReflowDirection.BOTTOM].includes(moveDirection);

    let distX: number = a.isVertical && isVerticalDrag ? 0 : a.posX - b.x;
    let distY: number = !a.isVertical && !isVerticalDrag ? 0 : a.posY - b.y;

    if (moveDirection === ReflowDirection.LEFT && distX > 20) distX += 2000;
    if (moveDirection === ReflowDirection.RIGHT && distX < -20) distX -= 2000;
    if (moveDirection === ReflowDirection.TOP && distY > 20) distY += 2000;
    if (moveDirection === ReflowDirection.BOTTOM && distY < -20) distY -= 2000;

    return Math.abs(Math.sqrt(distX * distX + distY * distY));
  };

  const getDropInfo = (val: XYCord): HighlightInfo | undefined => {
    if (lastActiveHighlight) return lastActiveHighlight;

    const payload: HighlightSelectionPayload = getHighlightPayload(
      null,
      undefined,
      val,
    );
    if (!payload) return;
    lastActiveHighlight = payload.selectedHighlight;
    return payload.selectedHighlight;
  };

  return {
    calculateHighlights,
    cleanUpTempStyles,
    getDropInfo,
    highlightDropPosition,
  };
};
