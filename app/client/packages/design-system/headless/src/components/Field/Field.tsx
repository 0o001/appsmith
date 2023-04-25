import classNames from "classnames";
import React, { forwardRef } from "react";
import type { LabelPosition } from "@react-types/shared";
import type { SpectrumFieldProps } from "@react-types/label";

import { Label } from "./Label";
import { ErrorText } from "./ErrorText";

export type FieldProps = SpectrumFieldProps;

export type FieldRef = any;

export const Field = forwardRef((props: FieldProps, ref: FieldRef) => {
  const {
    label,
    labelPosition = "top" as LabelPosition,
    labelAlign,
    isRequired,
    necessityIndicator,
    includeNecessityIndicatorInAccessibilityName,
    validationState,
    errorMessage,
    isDisabled,
    showErrorIcon,
    labelProps,
    errorMessageProps = {},
    elementType,
    children,
    wrapperClassName,
    wrapperProps = {},
    ...otherProps
  } = props;
  const hasErrorText = errorMessage && validationState === "invalid";

  const labelWrapperClass = classNames(
    "field",
    {
      "is-disabled": isDisabled,
      "field--positionTop": labelPosition === "top",
      "field--positionSide": labelPosition === "side",
      "field--alignEnd": labelAlign === "end",
    },
    wrapperClassName,
  );

  const renderErrorText = () => {
    return (
      <ErrorText
        errorMessage={errorMessage}
        errorMessageProps={errorMessageProps}
        isDisabled={isDisabled}
        showErrorIcon={showErrorIcon}
        validationState={validationState}
      />
    );
  };

  const renderChildren = () => {
    if (labelPosition === "side") {
      return (
        <div className="wrapper">
          {children}
          {hasErrorText && renderErrorText()}
        </div>
      );
    }

    return (
      <>
        {children}
        {hasErrorText && renderErrorText()}
      </>
    );
  };

  const labelAndContextualHelp = label && (
    <Label
      {...labelProps}
      elementType={elementType}
      includeNecessityIndicatorInAccessibilityName={
        includeNecessityIndicatorInAccessibilityName
      }
      isRequired={isRequired}
      labelAlign={labelAlign}
      labelPosition={labelPosition}
      necessityIndicator={necessityIndicator}
    >
      {label}
    </Label>
  );

  return (
    <div
      {...otherProps}
      {...wrapperProps}
      className={labelWrapperClass}
      ref={ref}
    >
      <div>{labelAndContextualHelp}</div>
      {renderChildren()}
    </div>
  );
});
