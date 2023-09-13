import type { AllChartData, ChartType } from "widgets/ChartWidget/constants";
import { allLabelsForAxis, maxWidthForLabels } from "../helpers";

export class EChartsYAxisLayoutBuilder {
  minimumWidth = 150;
  widgetWidth: number;
  chartType: ChartType
  seriesConfigs : AllChartData
  labelsWidth: number
  nameGap : number
  leftOffset: number

  constructor(widgetWidth: number, chartType: ChartType, seriesConfigs: AllChartData) {
    this.widgetWidth = widgetWidth;
    this.chartType = chartType
    this.seriesConfigs = seriesConfigs
    this.labelsWidth = this.widthForLabels()
    this.nameGap = this.labelsWidth + 10
    this.leftOffset = this.nameGap + 30
  }

  showYAxisConfig = () => {
    return this.widgetWidth >= this.minimumWidth;
  };

  gridLeftOffset = () => {
    return this.showYAxisConfig() ? this.leftOffset : 5;
  };

  config = () => {
    return {
      show: this.showYAxisConfig(),
      nameGap: this.nameGap,
      axisLabel: {
        width: this.labelsWidth,
      },
    };
  };

  widthForLabels = () => {
    const availableSpace = this.widgetWidth - this.minimumWidth
    const maxWidth = this.maxWidthForLabels()
    
    if (maxWidth < availableSpace) {
      return maxWidth
    } else {
      return availableSpace
    }
  }

  maxWidthForLabels = () => {
    console.log("***", "calculating labels for y axis")
    const labels = allLabelsForAxis("yAxis", this.chartType, this.seriesConfigs)
    console.log("***", "ALL LABELS FOR Y AXIS ARE ", labels)
    return maxWidthForLabels(labels)
  }
}
