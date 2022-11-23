import { Classes } from "@blueprintjs/core";
import React, {
  memo,
  ReactNode,
  useState,
  Context,
  createContext,
  useCallback,
} from "react";
import { Collapse } from "@blueprintjs/core";
import styled from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { AppIcon as Icon, Size } from "design-system";
import { AppState } from "@appsmith/reducers";
import { useDispatch, useSelector } from "react-redux";
import { getPropertySectionState } from "selectors/editorContextSelectors";
import { getWidgetPropsForPropertyPane } from "selectors/propertyPaneSelectors";
import { setPropertySectionState } from "actions/propertyPaneActions";

const SectionTitleWrapper = styled.div`
  cursor: pointer;
`;

const Label = styled.div`
  font-size: 11px;
  background: ${Colors.GRAY_100};
  color: ${Colors.GRAY_600};
  padding: 2px 4px;
`;

const SectionTitle = styled.span`
  color: ${Colors.GRAY_800};
  font-size: ${(props) => props.theme.fontSizes[3]}px;
  font-weight: 500;
  margin-right: 8px;
`;

const SectionWrapper = styled.div`
  position: relative;
  border-top: 1px solid ${Colors.GREY_4};
  padding: 12px 16px;

  &:first-of-type {
    border-top: 0;
  }

  /* Referring to a nested SectionWrapper */
  & & {
    padding: 0;
    margin-top: 8px;
    &:first-of-type {
      margin-top: 0;
    }
    ${Label} {
      display: none;
    }
  }

  & & ${SectionTitleWrapper} {
    margin-top: 10px;
    margin-bottom: 7px;
  }

  & & ${SectionTitleWrapper} span {
    color: ${Colors.GRAY_700};
    font-size: 12px;
  }

  .${Classes.COLLAPSE_BODY} {
    z-index: 1;
    position: relative;
    padding: 4px 0;
  }

  .bp3-collapse {
    transition: none;
  }
`;

const StyledIcon = styled(Icon)`
  margin-left: auto;
  svg path {
    fill: ${Colors.GRAY_700};
  }
`;

type PropertySectionProps = {
  id: string;
  name: string;
  childCount: number;
  collapsible?: boolean;
  children?: ReactNode;
  childrenWrapperRef?: React.RefObject<HTMLDivElement>;
  className?: string;
  // hidden?: (props: any, propertyPath: string) => boolean;
  isDefaultOpen?: boolean;
  propertyPath?: string;
  tag?: string; // Used to show a tag on the section title on search results
};

const areEqual = (prev: PropertySectionProps, next: PropertySectionProps) => {
  return prev.id === next.id && prev.childCount === next.childCount;
  // return false;
};

//Context is being provided to re-render anything that subscribes to this context on open and close
export const CollapseContext: Context<boolean> = createContext<boolean>(false);

export const PropertySection = memo((props: PropertySectionProps) => {
  const dispatch = useDispatch();
  const widgetProps: any = useSelector(getWidgetPropsForPropertyPane);
  const { isDefaultOpen = true } = props;
  const isDefaultContextOpen = useSelector(
    (state: AppState) =>
      getPropertySectionState(state, `${widgetProps?.widgetId}.${props.id}`),
    () => true,
  );
  const isSearchResult = props.tag !== undefined;
  const [isOpen, setIsOpen] = useState(
    isSearchResult
      ? true
      : isDefaultContextOpen !== undefined
      ? isDefaultContextOpen
      : !!isDefaultOpen,
  );

  const handleSectionTitleClick = useCallback(() => {
    if (props.collapsible)
      setIsOpen((x) => {
        dispatch(
          setPropertySectionState(`${widgetProps?.widgetId}.${props.id}`, !x),
        );
        return !x;
      });
  }, []);

  if (!widgetProps) return null;
  // if (props.hidden) {
  //   if (props.hidden(widgetProps, props.propertyPath || "")) {
  //     return null;
  //   }
  // }

  const className = props.name
    .split(" ")
    .join("")
    .toLowerCase();
  return (
    <SectionWrapper
      className={`t--property-pane-section-wrapper ${props.className}`}
    >
      <SectionTitleWrapper
        className={`t--property-pane-section-collapse-${className} flex items-center`}
        onClick={handleSectionTitleClick}
      >
        <SectionTitle>{props.name}</SectionTitle>
        {props.tag && <Label>{props.tag}</Label>}
        {props.collapsible && (
          <StyledIcon
            className="t--chevron-icon"
            name={isOpen ? "arrow-down" : "arrow-right"}
            size={Size.small}
          />
        )}
      </SectionTitleWrapper>
      {props.children && (
        <Collapse isOpen={isOpen} keepChildrenMounted transitionDuration={0}>
          <div
            className={`t--property-pane-section-${className}`}
            ref={props.childrenWrapperRef}
            style={{ position: "relative", zIndex: 1 }}
          >
            <CollapseContext.Provider value={isOpen}>
              {props.children}
            </CollapseContext.Provider>
          </div>
        </Collapse>
      )}
    </SectionWrapper>
  );
}, areEqual);

PropertySection.displayName = "PropertySection";

(PropertySection as any).whyDidYouRender = {
  logOnDifferentValues: false,
};

export default PropertySection;
