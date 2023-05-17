import React from "react";
import {
  useMergeRefs,
  FloatingPortal,
  FloatingArrow,
} from "@floating-ui/react";

import { useTooltipContext } from "./TooltipContext";

export type TooltipContentProps = React.HTMLAttributes<HTMLDivElement> & {
  portalId?: string;
};
export type TooltipContentRef = React.Ref<HTMLDivElement>;

export const TooltipContent = React.forwardRef(function TooltipContent(
  props: TooltipContentProps,
  propRef: TooltipContentRef,
) {
  const context = useTooltipContext();
  const { portalId, ...rest } = props;
  const ref = useMergeRefs([context.refs.setFloating, propRef]);
  const { children, ...floatingProps } = context.getFloatingProps(rest);

  if (!context.open) return null;

  return (
    <FloatingPortal id={portalId}>
      <div
        data-tooltip-content=""
        ref={ref}
        style={context.floatingStyles}
        {...floatingProps}
      >
        {children}
        <FloatingArrow
          context={context.context}
          data-tooltip-trigger-arrow=""
          ref={context.arrowRef}
        />
      </div>
    </FloatingPortal>
  );
});