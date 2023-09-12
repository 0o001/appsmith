import type {
  AllChartData,
  ChartType,
  LabelOrientation,
} from "widgets/ChartWidget/constants";
import { EChartElementVisibilityCalculator } from "./EChartsElementVisibilityCalculator";
import { EChartsXAxisLayoutBuilder } from "./EChartsXAxisLayoutBuilder";
import { EChartsYAxisLayoutBuilder } from "./EChartsYAxisLayoutBuilder";

type LayoutProps = {
  allowScroll: boolean;
  height: number;
  width: number;
  labelOrientation: LabelOrientation;
  chartType: ChartType;
  chartTitle: string;
  seriesConfig: AllChartData;
};

export class EChartsLayoutBuilder {
  minimumHeight = 80;
  gridPadding = 30;

  heightForAllowScollBar = 30;
  scrollBarBottomOffset = 30;

  heightForLegend = 50;
  heightForTitle = 50;

  priorityOrderOfInclusion = ["legend", "title", "xAxis", "scrollBar"];

  positionLayoutForElement: Record<string, "top" | "bottom"> = {
    xAxis: "bottom",
    legend: "top",
    title: "top",
    scrollBar: "bottom",
  };

  props: LayoutProps;

  layoutConfig: Record<string, Record<string, unknown>>;

  xAxisLayoutBuilder: EChartsXAxisLayoutBuilder;
  yAxisLayoutBuilder: EChartsYAxisLayoutBuilder;
  elementVisibilityLayoutBuilder: EChartElementVisibilityCalculator;

  constructor(props: LayoutProps) {
    this.props = props;
    this.xAxisLayoutBuilder = new EChartsXAxisLayoutBuilder(
      this.props.labelOrientation,
      this.props.chartType,
      this.props.seriesConfig
    );
    this.yAxisLayoutBuilder = new EChartsYAxisLayoutBuilder(this.props.width);

    this.elementVisibilityLayoutBuilder = new EChartElementVisibilityCalculator(
      {
        height: props.height,
        minimumHeight: this.minimumHeight,
        layoutConfigs: this.configParamsForVisibilityCalculation(),
        padding: this.gridPadding,
      },
    );

    this.layoutConfig = this.layoutConfigForElements();
    this.xAxisLayoutBuilder.maxHeight(this.props.seriesConfig)
  }

  heightForElement = (elementName: string): any => {
    switch (elementName) {
      case "xAxis":
        return this.xAxisLayoutBuilder.minAndMaxXAxisLabels()
        // return {
        //   min: 60,
        //   max: 100
        // }
      case "legend":
        return {
          min: this.heightForLegend,
          max: this.heightForLegend
        }
      case "title":
        return {
          min: this.heightForTitle,
          max: this.heightForTitle
        }
        return this.heightForTitle;
      case "scrollBar":
        return {
          min: this.layoutHeightForScrollBar(),
          max: this.layoutHeightForScrollBar()
        }
        return 
      default:
        return {
          min: 0,
          max: 0
        };
    }
  };

  layoutHeightForScrollBar = () => {
    return this.heightForAllowScollBar + this.scrollBarBottomOffset;
  };

  defaultConfigForElements = (): Record<string, Record<string, unknown>> => {
    const config: Record<string, Record<string, unknown>> = {};

    this.priorityOrderOfInclusion.map((elementName) => {
      config[elementName] = {
        show: false,
      };
    });
    config.grid = this.defaultConfigForGrid();

    config.yAxis = this.yAxisLayoutBuilder.config();

    config.xAxis = {
      ...config.xAxis,
      // ...this.xAxisLayoutBuilder.configForXAxis(),
    };
    console.log("***", "default xaxis config is ", config.xAxis)

    config.scrollBar = {
      ...config.scrollBar,
      bottom: this.scrollBarBottomOffset,
      height: this.heightForAllowScollBar,
    };

    return config;
  };

  layoutConfigForXAxis = () => {
    const { bottom, top } = this.elementVisibilityLayoutBuilder.visibleElements;
    const visibilityConfig = [...top, ...bottom];
    console.log("***", "visibility config is ", visibilityConfig)
    const configs = visibilityConfig.filter((config) => {
      return config.elementName == "xAxis"
    })
    console.log("***", "visibility config is ", configs)
    let xAxisConfig;

    
    if (configs.length > 0) {
      xAxisConfig = configs[0]
    }

    console.log("***", "xaxis config is ", xAxisConfig)
    const returnConfig = this.xAxisLayoutBuilder.configForXAxis(xAxisConfig?.height ?? 0)
    console.log("***", "return config is ", returnConfig)
    return returnConfig

    // return {
    //   ...xAxisConfig,
    //   // this.xAxisLayoutBuilder.configForXAxis(xAxisConfig?.height)
    // }
  }

  layoutConfigForElements = () => {
    const { bottom, top } = this.elementVisibilityLayoutBuilder.visibleElements;
    const visibilityConfig = [...top, ...bottom];

    const output = this.defaultConfigForElements();

    visibilityConfig.forEach((config) => {
      output[config.elementName].show = true;
    });

    const gridOffsets = this.elementVisibilityLayoutBuilder.calculateOffsets();

    output.grid.top = gridOffsets.top;
    output.grid.bottom = gridOffsets.bottom;
    output.legend.top = output.title.show ? 50 : 0;
    output.xAxis = {
      ...output.xAxis,
      ...this.layoutConfigForXAxis()
    }
    console.log("***", "output config for xaxis is ", output.xAxis)

    return output;
  };

  configParamsForVisibilityCalculation = () => {
    return this.configsToInclude().map((element) => {
      return {
        elementName: element,
        position: this.positionLayoutForElement[element],
        height: this.heightForElement(element),
      };
    });
  };

  defaultConfigForGrid() {
    return {
      top: 0,
      bottom: 0,
      left: this.yAxisLayoutBuilder.gridLeftOffset(),
    };
  }

  configsToInclude() {
    return this.priorityOrderOfInclusion.filter((configName) => {
      if (configName == "scrollBar") {
        return this.props.allowScroll;
      }
      if (configName == "legend") {
        return this.needsLegend(this.props.seriesConfig)
      }
      if (configName == "xAxis") {
        return this.props.chartType != "PIE_CHART";
      }
      if (configName == "title") {
        return this.props.chartTitle.length > 0;
      }
      return true;
    });
  }

  needsLegend(seriesConfig: AllChartData) {
    const seriesKeys = Object.keys(seriesConfig) 
    const numSeries = seriesKeys.length
    if (numSeries == 0) {
      return false
    } else if (numSeries == 1) {
      const seriesTitle = seriesConfig[seriesKeys[0]].seriesName ?? ""
      return seriesTitle.length > 0
    } else {
      return true
    }
  }
}
