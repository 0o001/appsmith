import { get } from "lodash";
import type { ChartType, ChartSelectedDataPoint, AllChartData } from "../constants";
import { omit, cloneDeep } from "lodash";

export const parseOnDataPointClickParams = (evt: any, chartType: ChartType) => {
  switch (chartType) {
    case "CUSTOM_FUSION_CHART": {
      return parseOnDataPointClickForCustomFusionChart(evt);
    }
    case "CUSTOM_ECHART": {
      return parseOnDataPointClickForCustomEChart(evt);
    }
    default: {
      return parseOnDataPointClickForBasicCharts(evt);
    }
  }
};

export const parseOnDataPointClickForCustomEChart = (
  evt: Record<string, unknown>,
): ChartSelectedDataPoint => {
  const rawEventData = omit(cloneDeep(evt), "event");
  return {
    x: undefined,
    y: undefined,
    seriesTitle: undefined,
    rawEventData: rawEventData,
  };
};

export const parseOnDataPointClickForCustomFusionChart = (
  evt: Record<string, unknown>,
): ChartSelectedDataPoint => {
  const data = evt.data as Record<string, unknown>;
  const seriesTitle = get(data, "datasetName", undefined);

  return {
    x: data.categoryLabel,
    y: data.dataValue,
    seriesTitle,
    rawEventData: data,
  } as ChartSelectedDataPoint;
};

export const parseOnDataPointClickForBasicCharts = (
  evt: Record<string, unknown>,
): ChartSelectedDataPoint => {
  const data: unknown[] = evt.data as unknown[];
  const x: unknown = data[0];

  const seriesIndex: number = evt.seriesIndex as number;
  const index = (seriesIndex ?? 0) + 1;
  const y: unknown = data[index];

  const seriesName: string | undefined = evt.seriesName as string;

  return {
    x: x,
    y: y,
    seriesTitle: seriesName,
  } as ChartSelectedDataPoint;
};

export const allLabelsForAxis = (axisName: "xAxis" | "yAxis", chartType: ChartType, seriesConfigs: AllChartData) => {
  let labelKey : "x" | "y";
  if (axisName == "xAxis") {
    labelKey = chartType == "BAR_CHART" ? "y" : "x"
  } else {
    labelKey = chartType == "BAR_CHART" ? "x" : "y"
  }
  const seriesIDs = Object.keys(seriesConfigs)

  let labels : string[] = []

  for (const seriesID of seriesIDs) {
    const datapoints = seriesConfigs[seriesID].data
    console.log("***", "chart type is ", chartType)
    console.log("***", "label key is ", labelKey)
    console.log("***", "data points is ", datapoints)
    const seriesLabels = datapoints.map((datapoint) => {
      return datapoint[labelKey].toString()
      // if (chartType == "BAR_CHART") {
      //   return datapoint[labelKey].toString()
      // } else {
      //   return 
      // }
    })

    labels = [...labels, ...seriesLabels]
  }
  console.log("***", "all labels are ", labels)
  return labels
}

export const maxWidthForLabels = (labels: string[]) => {
  let maxLength : number = 0
  let maxString = ""

  for (const label of labels) {
    // console.log("***", "iterating over label ", label)
    if (label.length > maxLength) {
      maxLength = label.length
      maxString = label
    } else {
      console.log("***", "coming in else ", label.length)
    }
  }
  return getTextWidth(maxString)
}

export const getTextWidth = (text: string) => {
  // re-use canvas object for better performance
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (context) {
    const font = "12px Nunito Sans"
    context.font = font;
    console.log("***", "measuring text ", text)
    const metrics = context.measureText(text);
    return metrics.width;
  } else {
    return 0;
  }
}
