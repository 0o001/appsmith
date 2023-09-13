import { Label } from "@blueprintjs/core";
import { max } from "lodash";
import { LabelOrientation } from "widgets/ChartWidget/constants";
import type { AllChartData, ChartType } from "widgets/ChartWidget/constants";
import { allLabelsForAxis, maxWidthForLabels } from "../helpers";

export class EChartsXAxisLayoutBuilder {
  labelOrientation: LabelOrientation;
  chartType: ChartType;
  seriesConfig: AllChartData

  gapBetweenLabelAndName = 10;
  defaultHeightForXAxisLabels = 30;
  defaultHeightForRotatedLabels = 50;
  defaultHeightForXAxisName = 40;

  constructor(labelOrientation: LabelOrientation, chartType: ChartType, seriesConfig: AllChartData) {
    this.labelOrientation = labelOrientation;
    this.chartType = chartType;
    this.seriesConfig = seriesConfig
  }

  configForXAxis(width: number) {
    return {
      nameGap: width - this.defaultHeightForXAxisName,
      axisLabel: this.axisLabelConfig(width)
    };
  }

  axisLabelConfig = (width : number) => {
    if (this.labelOrientation == LabelOrientation.AUTO) {
      return {
        
      }
    } else {
      return {
        width: width - this.defaultHeightForXAxisName - this.gapBetweenLabelAndName,
        overflow: "truncate"
      }
    }
  }

  heightForXAxis = () => {
    if (this.chartType == "PIE_CHART") {
      return 0;
    } else {
      const result = this.heightForXAxisLabels() + this.defaultHeightForXAxisName;
      console.log("***", "height for all xaxis is ", result)
      return result
    }
    // return 0;
    // return this.heightForXAxisLabels() + this.defaultHeightForXAxisName;
  };

  heightForXAxisLabels = () : number => {
    let labelsHeight: number;

    if (this.labelOrientation == LabelOrientation.AUTO) {
      labelsHeight = this.defaultHeightForXAxisLabels;
    } else {
      labelsHeight = this.widthForXAxisLabels();
    }
    console.log("***", "pixel height for labels is ", labelsHeight)
    const result = labelsHeight + this.gapBetweenLabelAndName
    console.log("***", "height for xaxis labels is ", result)
    return result
  };

  // maxHeight = (chartType: ChartType, seriesConfigs : AllChartData) => {
  //   const keys = Object.keys(seriesConfigs)
  //   let maxLength : number = 0
  //   let maxString = ""

    
  //   for (const key of keys) {
  //     const seriesData : string[] = seriesConfigs[key].data.map((datapoint) => {
  //       if (chartType == "BAR_CHART") {
  //         return datapoint.y
  //       } else {
  //         return datapoint.x
  //       }
  //     })

  //     labels = [...labels, ...seriesData]
  //   }
  //   // console.log("***", "all labels are ", labels)
  //   for (const label of labels) {
  //     // console.log("***", "iterating over label ", label)
  //     if (label.length > maxLength) {
  //       maxLength = label.length
  //       maxString = label
  //     }
  //   }
  //   const widthInPixels = this.getTextWidth(maxString)
  //   console.log("***", "max length is ", maxLength, maxString)
  //   console.log("***", "width in pixels is ", widthInPixels)
  //   return widthInPixels
  // }

  

  widthForXAxisLabels = () => {
    switch (this.labelOrientation) {
      case LabelOrientation.AUTO: {
        return 0;
      }
      default: {
        const labels = allLabelsForAxis("xAxis", this.chartType, this.seriesConfig)
        return maxWidthForLabels(labels)
      }
    }
  }

  minAndMaxXAxisLabels = () => {
    const minHeight = this.minHeightForLabels();
    const maxHeight = this.heightForXAxis()

    const result = {
      min: minHeight > maxHeight ? maxHeight : minHeight,
      max: this.heightForXAxis()
    }
    console.log("***", "min and max requested is ", JSON.stringify(result))
    return result
  };

  minHeightForLabels() {
    if (this.chartType == "PIE_CHART") {
      return 0;
    }

    let labelsHeight : number
    if (this.labelOrientation == LabelOrientation.AUTO) {
      labelsHeight = this.defaultHeightForXAxisLabels
    } else {
      labelsHeight = this.defaultHeightForRotatedLabels
    }
    return labelsHeight + this.gapBetweenLabelAndName + this.defaultHeightForXAxisName
  }
}
