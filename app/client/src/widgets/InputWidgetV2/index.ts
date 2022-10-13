import Widget from "./widget";
import IconSVG from "./icon.svg";
import { CONFIG as BaseConfig } from "widgets/BaseInputWidget";
import { PropertyPaneConfigTypes } from "constants/PropertyControlConstants";

export const CONFIG = {
  features: {
    dynamicHeight: {
      enabled: true,
      propertyPaneConfigType: PropertyPaneConfigTypes.CONTENT,
    },
  },
  type: Widget.getWidgetType(),
  name: "Input",
  iconSVG: IconSVG,
  needsMeta: true,
  searchTags: ["form", "text input", "number", "textarea"],
  defaults: {
    ...BaseConfig.defaults,
    inputType: "TEXT",
    widgetName: "Input",
    version: 2,
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
