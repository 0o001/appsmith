import { LabelOrientation } from "widgets/ChartWidget/constants";
import type { ChartType } from "widgets/ChartWidget/constants";

export class EChartsXAxisLayoutBuilder {
  labelOrientation: LabelOrientation;
  chartType: ChartType;

  gapBetweenLabelAndName = 10;
  defaultHeightForXAxisLabels = 30;
  defaultHeightForXAxisName = 40;

  constructor(labelOrientation: LabelOrientation, chartType: ChartType) {
    this.labelOrientation = labelOrientation;
    this.chartType = chartType;
  }

  configForXAxis(width: number) {
    return {
      nameGap: this.heightForXAxisLabels(width),
      axisLabel: {
        width: width,
      },
    };
  }

  // heightForXAxis = () => {
  //   if (this.chartType == "PIE_CHART") {
  //     return 0;
  //   }
  //   return 0;
  //   // return this.heightForXAxisLabels() + this.defaultHeightForXAxisName;
  // };

  heightForXAxisLabels = (width: number) => {
    let labelsHeight: number = this.defaultHeightForXAxisLabels;
    if (this.labelOrientation != LabelOrientation.AUTO) {
      labelsHeight = width;
    }
    return labelsHeight + this.gapBetweenLabelAndName;
  };

  widthForXAxis;

  minAndMaxXAxisLabels = () => {
    return {
      min: 60,
      max: 100,
    };
    switch (this.labelOrientation) {
      case LabelOrientation.SLANT: {
        return 50;
      }
      default: {
        return 60;
      }
    }
  };
}
