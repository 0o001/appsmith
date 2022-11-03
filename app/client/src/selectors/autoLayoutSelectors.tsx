import { AppState } from "ce/reducers";
import {
  FlexLayer,
  LayerChild,
} from "components/designSystems/appsmith/autoLayout/FlexBoxComponent";
import { createSelector } from "reselect";
import { getWidgets } from "sagas/selectors";

export const getFlexLayers = (parentId: string) => {
  return createSelector(getWidgets, (widgets): FlexLayer[] => {
    const parent = widgets[parentId];
    if (!parent) return [];
    return parent?.flexLayers || [];
  });
};

export const getSiblingCount = (widgetId: string, parentId: string) => {
  return createSelector(getFlexLayers(parentId), (flexLayers): number => {
    if (!flexLayers) return -1;
    const selectedLayer = flexLayers?.find((layer: FlexLayer) =>
      layer.children?.some((child: LayerChild) => child.id === widgetId),
    );
    if (!selectedLayer) return -1;
    return selectedLayer.children?.length;
  });
};

export const getLayerIndex = (widgetId: string, parentId: string) => {
  return createSelector(
    getFlexLayers(parentId),
    (layers: FlexLayer[]): number => {
      if (!layers) return -1;
      const selectedLayer = layers.find((layer: FlexLayer) =>
        layer.children.some((child: LayerChild) => child.id === widgetId),
      );
      if (!selectedLayer) return -1;
      return selectedLayer.children?.findIndex(
        (child: LayerChild) => child.id === widgetId,
      );
    },
  );
};

export const isCurrentCanvasDragging = (widgetId: string) => {
  return createSelector(
    (state: AppState) => state.ui.widgetDragResize.dragDetails,
    (dragDetails): boolean => {
      return dragDetails?.draggedOn === widgetId;
    },
  );
};
