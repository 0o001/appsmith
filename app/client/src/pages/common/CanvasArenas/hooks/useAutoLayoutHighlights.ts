import { getWidgets } from "sagas/selectors";
import { useSelector } from "store";

import {
  LayoutDirection,
  LayoutWrapperType,
  ResponsiveBehavior,
} from "components/constants";
import { isArray, isNaN } from "lodash";
import { WidgetDraggingBlock } from "./useBlocksToBeDraggedOnCanvas";

interface XYCord {
  x: number;
  y: number;
}

export interface Highlight {
  x: number;
  y: number;
  height: number;
  width: number;
  wrapperType: LayoutWrapperType;
}

export interface AutoLayoutHighlightProps {
  blocksToDraw: WidgetDraggingBlock[];
  canvasId: string;
  direction?: LayoutDirection;
  dropPositionRef: React.RefObject<HTMLDivElement>;
  isCurrentDraggedCanvas: boolean;
  isDragging: boolean;
  useAutoLayout?: boolean;
  widgetName?: string;
}

export interface DropPositionPayload {
  index: number;
  wrapperType: LayoutWrapperType;
}

const BASE_OFFSET_SIZE = 100;
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
  const isCanvasWrapper = canvas.isWrapper || false;
  const isVertical = direction === LayoutDirection.Vertical;

  let offsets: Highlight[] = [];
  let dragBlocksSize = 0;
  const siblingElements: any[] = [];
  let lastTranslatedIndex: number;
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

  // Create and add an initial offset for an empty canvas
  const getInitialOffset = (
    isWrapper: boolean,
    wrapperType: LayoutWrapperType = LayoutWrapperType.Start,
  ): Highlight => {
    let mOffset: Highlight;
    const reverse = isWrapper && wrapperType === LayoutWrapperType.End;
    if (isVertical) {
      mOffset = {
        x: 0,
        y: reverse ? containerDimensions.bottom - 8 : 8,
        width: containerDimensions?.width || BASE_OFFSET_SIZE,
        height: OFFSET_WIDTH,
        wrapperType,
      };
    } else {
      mOffset = {
        x: reverse ? containerDimensions.right - 8 : 8,
        y: 0,
        width: OFFSET_WIDTH,
        height: containerDimensions?.height || BASE_OFFSET_SIZE,
        wrapperType,
      };
    }
    return mOffset;
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
    dragBlocksSize = 0;
    lastTranslatedIndex = -10;
    // Hide the highlight
    if (dropPositionRef && dropPositionRef.current) {
      dropPositionRef.current.style.opacity = "0";
      dropPositionRef.current.style.display = "none";
    }
  };

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

  // Get a list of widgetIds that are being dragged.
  const getDraggedBlocks = (): string[] => {
    const blocks = blocksToDraw.map((block) => block.widgetId);
    // console.log(`#### blocksToDraw: ${JSON.stringify(blocksToDraw)}`);
    // console.log(`#### blocks: ${JSON.stringify(blocks)}`);
    return blocks;
  };

  // Get the total 1D size of the drag block.
  const calculateDragBlockSize = (): void => {
    blocksToDraw?.forEach((each) => {
      dragBlocksSize += isVertical ? each.height : each.width;
    });
  };

  const getOffset = (
    rect: DOMRect,
    flexOffsetTop: number,
    wrapperType: LayoutWrapperType,
    isFinal?: boolean,
  ): Highlight => {
    let mOffset: Highlight;
    // Remove the offsets of the canvas and the flex container.
    const valueToSubtract = {
      x: containerDimensions?.left,
      y: containerDimensions?.top + flexOffsetTop,
    };
    // For the final offset, include the size of the last sibling and a margin.
    const valueToAdd = isFinal
      ? {
          x: rect.width + 8,
          y: isVertical ? rect.height + 8 : 0,
        }
      : { x: 0, y: 0 };
    if (isVertical) {
      mOffset = {
        x: 0,
        y: rect.top - valueToSubtract.y + valueToAdd.y,
        width: containerDimensions.width,
        height: OFFSET_WIDTH,
        wrapperType,
      };
    } else {
      mOffset = {
        x: rect.left - valueToSubtract.x + valueToAdd.x,
        y: rect.top - valueToSubtract.y + valueToAdd.y,
        height: rect.height,
        width: OFFSET_WIDTH,
        wrapperType,
      };
    }
    // console.log(`#### offset: ${JSON.stringify(mOffset)}`);
    return mOffset;
  };

  // Get the nearest ancestor that is a wrapper, including itself.
  const getNearestWrapperAncestor = (widgetId: string): string => {
    const widget = allWidgets[widgetId];
    if (widget?.isWrapper) return widgetId;
    const parentId = widget?.parentId;
    if (!parentId) return "";
    return getNearestWrapperAncestor(parentId);
  };

  const isWrapperEmpty = (
    widgetId: string,
    draggedBlocks: string[],
  ): boolean => {
    const widget = allWidgets[widgetId];
    if (!widget) return true;
    const rest =
      widget?.children?.filter((child) => draggedBlocks?.indexOf(child) == -1)
        .length || 0;
    return rest === 0;
  };

  const hideDraggedItems = (arr: string[]): void => {
    arr?.forEach((each) => {
      // Get the parent wrapper
      const wrapperId = getNearestWrapperAncestor(each);
      if (wrapperId === canvasId) return;
      /**
       * If the wrapper is not the dragging canvas and is empty,
       * then hide it,
       * else hide the child element.
       */
      const el = isWrapperEmpty(wrapperId, arr)
        ? getDomElement(wrapperId)
        : getDomElement(each);
      el?.classList?.add("auto-temp-no-display");
    });
  };

  const hasFillChild = (arr: string[]): boolean => {
    if (!arr || !arr.length) return false;
    let flag = false;
    for (const widgetId of arr) {
      const widget = allWidgets[widgetId];
      if (widget?.responsiveBehavior === ResponsiveBehavior.Fill) {
        flag = true;
        break;
      }
    }
    return flag;
  };

  const calculateHighlightOffsets = (): Highlight[] => {
    cleanUpTempStyles();
    // console.log(
    //   `#### ${widgetName} - ${isDragging} - ${isCurrentDraggedCanvas}`,
    // );
    if (useAutoLayout && isDragging && isCurrentDraggedCanvas) {
      // console.log("#### START calculate highlight offsets");
      // console.log(`#### canvas id: ${widgetId} : ${widgetName}`);
      // calculate total drag size to translate siblings by
      calculateDragBlockSize();
      const blocks = getDraggedBlocks();

      if (!blocks || !blocks.length) return [];

      /**
       * update dimensions of the current canvas
       * and break out of the function if returned value is false.
       * That implies the container is null.
       */
      if (!updateContainerDimensions()) return [];

      // Temporarily hide dragged children to discount them from offset calculation
      hideDraggedItems(blocks);
      // Get all children of current dragging canvas
      const canvasChildren = canvas.children || [];
      const offsetChildren = canvasChildren.filter((each) => {
        if (canvas.isWrapper) return blocks.indexOf(each) === -1;
        const children = allWidgets[each].children?.filter(
          (item) => blocks.indexOf(item) === -1,
        );
        return isArray(children) && children.length > 0;
      });
      // console.log(`#### canvas children: ${JSON.stringify(canvasChildren)}`);
      // console.log(`#### offset children: ${JSON.stringify(offsetChildren)}`);
      const flex = document.querySelector(`.flex-container-${canvasId}`);
      const flexOffsetTop = (flex as any)?.offsetTop || 0;
      let temp: Highlight[] = [];
      const discardEndWrapper: boolean = hasFillChild(offsetChildren);
      if (canvas.isWrapper && !discardEndWrapper) {
        const start: string[] = [],
          center: string[] = [],
          end: string[] = [];
        offsetChildren.forEach((each) => {
          if (allWidgets[each]?.wrapperType === LayoutWrapperType.Start)
            start.push(each);
          else end.push(each);
        });
        const arr1: Highlight[] = evaluateOffsets(
          start,
          flexOffsetTop,
          true,
          LayoutWrapperType.Start,
        );
        const arr2: Highlight[] = evaluateOffsets(
          center,
          flexOffsetTop,
          true,
          LayoutWrapperType.Center,
        );
        const arr3: Highlight[] = evaluateOffsets(
          end,
          flexOffsetTop,
          true,
          LayoutWrapperType.End,
        );
        temp = [...arr1, ...arr2, ...arr3];
      } else
        temp = evaluateOffsets(
          offsetChildren,
          flexOffsetTop,
          false,
          LayoutWrapperType.Start,
        );
      offsets = [...offsets, ...temp];

      if (!offsets || !offsets.length)
        offsets = [getInitialOffset(isCanvasWrapper)];
      // console.log(`#### offsets: ${JSON.stringify(offsets)}`);
      // console.log(`#### END calculate highlight offsets`);
    }
    return offsets;
  };

  const evaluateOffsets = (
    arr: string[],
    flexOffsetTop: number,
    isWrapper: boolean,
    wrapperType: LayoutWrapperType,
  ): Highlight[] => {
    let res: Highlight[] = [];
    const siblings: DOMRect[] = [];
    if (arr && arr.length) {
      // Get widget ids of all widgets being dragged
      arr.forEach((each) => {
        const el = getDomElement(each);
        if (!el) return;

        // console.log(`#### child: ${el.className}`);
        // console.log(`#### offset parent: ${el.offsetParent.className}`);
        const rect: DOMRect = el.getBoundingClientRect();
        // console.log(`#### bounding rect: ${JSON.stringify(rect)}`);
        // Add a new offset using the current element's dimensions and position
        res.push(getOffset(rect, flexOffsetTop, wrapperType, false));
        siblings.push(rect);
        siblingElements.push(el);
      });
      /**
       * If the dragged element has siblings,
       * then add another offset at the end of the last sibling
       * to demarcate the final drop position.
       */
      if (siblings.length) {
        res.push(
          getOffset(
            wrapperType === LayoutWrapperType.End
              ? siblings[siblings.length - 1]
              : siblings[siblings.length - 1],
            flexOffsetTop,
            wrapperType,
            true,
          ),
        );
      }
      res = [...new Set(res)];
    } else res = [getInitialOffset(isWrapper, wrapperType)];
    return res;
  };

  /**
   * END AUTO LAYOUT OFFSET CALCULATION
   */

  const translateSiblings = (position: Highlight): void => {
    let dropIndex = 0;
    if (position)
      dropIndex = offsets
        ?.map((each) => `${each.x},${each.y}`)
        .indexOf(`${position.x},${position.y}`);
    if (dropIndex === lastTranslatedIndex) return;

    lastTranslatedIndex = dropIndex;
    // console.log(`#### lastTranslatedIndex: ${lastTranslatedIndex}`);
    return;
    // Get all siblings after the highlighted drop position
    const arr = [...siblingElements];

    // translate each element in the appropriate direction
    const x = !isVertical ? dragBlocksSize : 0;
    const y = isVertical ? dragBlocksSize : 0;
    arr.forEach((each, index) => {
      if (index < dropIndex) {
        each.style.transform = null;
      } else {
        each.style.transform = `translate(${x}px, ${y}px)`;
        each.style.transitionDuration = "0.2s";
      }
    });
  };

  const highlightDropPosition = (e: any) => {
    if (!useAutoLayout) return;
    const pos: Highlight | undefined = getHighlightPosition(e);
    // console.log(`#### Highlight position: ${JSON.stringify(pos)}`);
    if (!pos) return;
    if (dropPositionRef && dropPositionRef.current) {
      dropPositionRef.current.style.opacity = "1";
      dropPositionRef.current.style.top = (pos.y > 6 ? pos.y - 6 : 0) + "px";
      dropPositionRef.current.style.left =
        (pos.x > 6
          ? Math.min(
              pos.x - 6,
              containerDimensions.left + containerDimensions.width - 6,
            )
          : 0) + "px";
      dropPositionRef.current.style.width = pos.width + "px";
      dropPositionRef.current.style.height = pos.height + "px";
      dropPositionRef.current.style.display = "block";
    }
    translateSiblings(pos);
  };

  const getHighlightPosition = (e: any, val?: XYCord): Highlight => {
    let base: Highlight[] = [];
    if (!offsets || !offsets.length)
      offsets = [getInitialOffset(isCanvasWrapper)];
    base = offsets;

    const pos: XYCord = {
      x: e?.offsetX || val?.x,
      y: e?.offsetY || val?.y,
    };

    const arr = [...base].sort((a, b) => {
      return calculateDistance(a, pos) - calculateDistance(b, pos);
    });
    return arr[0];
  };

  const calculateDistance = (a: Highlight, b: XYCord): number => {
    const x: number = a.x + a.width / 2 - b.x;
    const y: number = a.y + a.height / 2 - b.y;
    return Math.abs(Math.sqrt(x * x + y * y));
  };

  const getDropPosition = (index: number): number => {
    if (isNaN(index)) return 0;
    const wrapperType: LayoutWrapperType =
      offsets[index]?.wrapperType || LayoutWrapperType.Start;
    if (wrapperType === LayoutWrapperType.Center) return index - 1;
    if (wrapperType === LayoutWrapperType.End) return index - 2;
    return index;
  };

  const getDropInfo = (val: XYCord): DropPositionPayload | undefined => {
    if (!isNaN(lastTranslatedIndex) && lastTranslatedIndex >= 0)
      return {
        index: getDropPosition(lastTranslatedIndex),
        wrapperType: offsets[lastTranslatedIndex]?.wrapperType,
      };
    const pos = getHighlightPosition(null, val);
    if (!pos) return;
    const dropPos: number = offsets.indexOf(pos);
    return {
      index: getDropPosition(dropPos),
      wrapperType: offsets[dropPos]?.wrapperType,
    };
  };

  return {
    calculateHighlightOffsets,
    cleanUpTempStyles,
    getDropInfo,
    highlightDropPosition,
  };
};
