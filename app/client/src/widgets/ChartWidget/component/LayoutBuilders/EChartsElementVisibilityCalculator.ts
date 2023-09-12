import { element } from "prop-types";

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
    this.visibleElements = this.heightsForElements();
    console.log("***", "visible elements is ", this.visibleElements)
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

  heightsForElements() {
    let remainingHeight = this.availableHeight();
    let index = 0;
    const count = this.props.layoutConfigs.length;

    const result : any = {}

    while (index < count && remainingHeight > 0) {
      const config = {...this.props.layoutConfigs[index]} ;
      console.log("***", "config is ", config, " remaining height is ", remainingHeight)
      // const allocatedHeight = this.allocatedHeightForConfig(config.height, remainingHeight)
      const heightConfig : any = config.height
      // console.log("***", "allocated height is ", allocatedHeight)
      if ((heightConfig).min <= remainingHeight) {
        remainingHeight -= heightConfig.min;
        result[config.elementName] = {
          height: heightConfig.min,
          min: heightConfig.min,
          max: heightConfig.max,
          position: config.position,
          elementName: config.elementName
        }
        index = index + 1;
      } else {
        break;
      }
    }

    for (const key in result) {
      if (remainingHeight > 0) {
        const heightConfig = result[key] as any
        const allocatedHeight = this.allocateRemainingHeight(remainingHeight, heightConfig)
        console.log("***", "allocating remaining space ", allocatedHeight, " to ", result[key].elementName)
        remainingHeight -= allocatedHeight
        heightConfig.height += allocatedHeight
      } else {
        break;
      }
    }
    
    const output : any = {
      top: [],
      bottom: []
    }

    for (const key in result) {
      const elementConfig = result[key]
      if (result[key].position == "top") {
        output.top.push(elementConfig)
      } else {
        output.bottom.push(elementConfig)
      }
    }
    return output
  }

  elementsToInclude() {
    let remainingHeight = this.availableHeight();
    let index = 0;
    const count = this.props.layoutConfigs.length;

    const output : any = {
      top: [] as EChartElementLayoutParams[],
      bottom: [] as EChartElementLayoutParams[],
    };

    while (index < count && remainingHeight > 0) {
      const config = {...this.props.layoutConfigs[index]} ;
      console.log("***", "config is ", config)
      // const allocatedHeight = this.allocatedHeightForConfig(config.height, remainingHeight)
      const heightConfig : any = config.height
      // console.log("***", "allocated height is ", allocatedHeight)
      if ((heightConfig).min <= remainingHeight) {
        remainingHeight -= heightConfig;
        config.height = heightConfig.min
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
    output.remainingHeight = remainingHeight
    console.log("***", "output config is ", output)
    return output;
  }

  allocateRemainingHeight(remainingHeight: number, heightConfig: any) {
    console.log("***", "calling allocate height with remaining height ", remainingHeight, " height config ", heightConfig)
    let difference = heightConfig.max - heightConfig.min
    if (remainingHeight > difference) {
      return difference
    } else {
      return remainingHeight
    }
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
