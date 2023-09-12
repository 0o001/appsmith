export type EChartElementLayoutParams = {
  elementName: string;
  height: number;
  position: "top" | "bottom";
};

export type EChartElementVisibilityProps = {
  height: number;
  padding: number;
  minimumHeight: number;
  layoutConfigs: EChartElementLayoutParams[];
};
export class EChartElementVisibilityCalculator {
  props: EChartElementVisibilityProps;
  visibleElements: {
    top: EChartElementLayoutParams[];
    bottom: EChartElementLayoutParams[];
  };

  constructor(props: EChartElementVisibilityProps) {
    this.props = props;
    this.visibleElements = this.elementsToInclude();
  }

  needsCustomTopPadding() {
    return this.visibleElements.top.length == 0;
  }

  needsCustomBottomPadding() {
    return this.visibleElements.bottom.length == 0;
  }

  calculateOffsets() {
    let top = this.needsCustomTopPadding() ? this.props.padding : 0;
    let bottom = this.needsCustomBottomPadding() ? this.props.padding : 0;

    for (const config of this.visibleElements.top) {
      top += config.height;
    }

    for (const config of this.visibleElements.bottom) {
      bottom += config.height;
    }
    return {
      top: top,
      bottom: bottom,
    };
  }

  availableHeight() {
    return this.props.height - this.props.minimumHeight;
  }

  elementsToInclude() {
    let remainingHeight = this.availableHeight();
    let index = 0;
    const count = this.props.layoutConfigs.length;

    const output = {
      top: [] as EChartElementLayoutParams[],
      bottom: [] as EChartElementLayoutParams[],
    };

    while (index < count && remainingHeight > 0) {
      const config = {...this.props.layoutConfigs[index]} ;
      console.log("***", "config is ", config)
      const allocatedHeight = this.allocatedHeightForConfig(config.height, remainingHeight)
      console.log("***", "allocated height is ", allocatedHeight)
      if (allocatedHeight > 0) {
        remainingHeight -= allocatedHeight;
        config.height = allocatedHeight
        index = index + 1;
        if (config.position == "top") {
          output.top.push(config);
        } else {
          output.bottom.push(config);
        }
      } else {
        break;
      }
      // if (config.height <= remainingHeight) {
        
      // } else {
      //   break;
      // }
    }
    console.log("***", "output config is ", output)
    return output;
  }

  allocatedHeightForConfig(heightConfig : any, availableHeight: number) {
    if (availableHeight > heightConfig.max) {
      return heightConfig.max
    } else if (availableHeight < heightConfig.min) {
      return 0
    } else {
      return availableHeight
    }
    // console.log("***", "available height is ", availableHeight)
    // const difference = availableHeight - heightConfig.max
    // if (difference >= 0) {
    //   return heightConfig.max
    // } else {
    //   const allocatedHeight = heightConfig.max - (-1*difference)
    //   if (allocatedHeight >= heightConfig.min) {
    //     return allocatedHeight
    //   } else {
    //     return 0;
    //   }
    // }
  }
}
