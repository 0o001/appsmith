import { RenderModes } from "constants/WidgetConstants";
import { FixedLayoutEditorWrapper } from "./editor/FixedLayoutEditorWrapper";
import { FixedLayoutViewerWrapper } from "./viewer/FixedLayoutViewerWrapper";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";

/**
 * getFixedLayoutComponentDimensions
 *
 * utiltiy function to compute a widgets dimensions in Fixed layout system
 *
 */

const getFixedLayoutComponentDimensions = ({
  bottomRow,
  leftColumn,
  parentColumnSpace,
  parentRowSpace,
  rightColumn,
  topRow,
}: BaseWidgetProps) => {
  return {
    componentWidth: (rightColumn - leftColumn) * parentColumnSpace,
    componentHeight: (bottomRow - topRow) * parentRowSpace,
  };
};

/**
 * getFixedLayoutSystemPropsEnhancer
 *
 * utiltiy function to enhance BaseWidgetProps with Fixed Layout system specific props
 *
 */

const getFixedLayoutSystemPropsEnhancer = (props: BaseWidgetProps) => {
  const { componentHeight, componentWidth } =
    getFixedLayoutComponentDimensions(props);
  return {
    ...props,
    componentHeight,
    componentWidth,
  };
};

/**
 * getFixedLayoutSystemWrapper
 *
 * utiltiy function to return the fixed layout system wrapper based on render mode.
 * wrapper is the component that wraps around a widget to provide layouting ability and enable editing experience.
 *
 */
const getFixedLayoutSystemWrapper = (renderMode: RenderModes) => {
  if (renderMode === RenderModes.CANVAS) {
    return FixedLayoutEditorWrapper;
  } else {
    return FixedLayoutViewerWrapper;
  }
};

/**
 * getFixedLayoutSystem
 *
 * utiltiy function to return the fixed layout system config for
 * wrapper based on render mode and property enhancer funciton
 *
 */
export function getFixedLayoutSystem(renderMode: RenderModes) {
  return {
    LayoutSystemWrapper: getFixedLayoutSystemWrapper(renderMode),
    propertyEnhancer: getFixedLayoutSystemPropsEnhancer,
  };
}
