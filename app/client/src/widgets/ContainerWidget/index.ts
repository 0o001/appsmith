import {
  ButtonBoxShadowTypes,
  Positioning,
  ResponsiveBehavior,
} from "components/constants";
import { Colors } from "constants/Colors";
import { FILL_WIDGET_MIN_WIDTH } from "constants/minWidthConstants";
import IconSVG from "./icon.svg";
import Widget from "./widget";

export const CONFIG = {
  type: Widget.getWidgetType(),
  name: "Container",
  iconSVG: IconSVG,
  isCanvas: true,
  searchTags: ["div", "parent", "group"],
  defaults: {
    backgroundColor: "#FFFFFF",
    rows: 40,
    columns: 24,
    widgetName: "Container",
    containerStyle: "card",
    borderColor: Colors.GREY_5,
    borderWidth: "1",
    boxShadow: ButtonBoxShadowTypes.NONE,
    animateLoading: true,
    children: [],
    blueprint: {
      view: [
        {
          type: "CANVAS_WIDGET",
          position: { top: 0, left: 0 },
          props: {
            containerStyle: "none",
            canExtend: false,
            detachFromLayout: true,
            children: [],
          },
        },
      ],
    },
    version: 1,
    positioning: Positioning.Vertical,
    responsiveBehavior: ResponsiveBehavior.Fill,
    minWidth: FILL_WIDGET_MIN_WIDTH,
  },
  properties: {
    derived: Widget.getDerivedPropertiesMap(),
    default: Widget.getDefaultPropertiesMap(),
    meta: Widget.getMetaPropertiesMap(),
    config: Widget.getPropertyPaneConfig(),
    contentConfig: Widget.getPropertyPaneContentConfig(),
    styleConfig: Widget.getPropertyPaneStyleConfig(),
  },
};

export default Widget;
