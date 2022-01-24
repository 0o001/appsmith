import moment from "moment";
import React, { useContext, useRef } from "react";
import { pick } from "lodash";

import DateComponent from "widgets/DatePickerWidget2/component";
import Field from "widgets/JSONFormWidget/component/Field";
import FormContext from "../FormContext";
import useEvents from "./useEvents";
import useRegisterFieldValidity from "./useRegisterFieldInvalid";
import {
  FieldComponentBaseProps,
  BaseFieldComponentProps,
  FieldEventProps,
  ComponentDefaultValuesFnProps,
} from "../constants";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { dateFormatOptions } from "../widget/propertyConfig/properties/date";
import { ISO_DATE_FORMAT } from "constants/WidgetValidation";
import { TimePrecision } from "widgets/DatePickerWidget2/constants";

type DateComponentProps = FieldComponentBaseProps &
  FieldEventProps & {
    closeOnSelection: boolean;
    convertToISO: boolean;
    dateFormat: string;
    maxDate: string;
    minDate: string;
    onDateChange?: string;
    onDateSelected?: string;
    shortcuts: boolean;
    timePrecision: TimePrecision;
  };

const COMPONENT_DEFAULT_VALUES = {
  closeOnSelection: false,
  convertToISO: false,
  dateFormat: "YYYY-MM-DD HH:mm",
  isDisabled: false,
  isRequired: false,
  isVisible: true,
  label: "",
  maxDate: "2121-12-31T18:29:00.000Z",
  minDate: "1920-12-31T18:30:00.000Z",
  shortcuts: false,
  timePrecision: TimePrecision.MINUTE,
};

const componentDefaultValues = ({
  bindingTemplate,
  isCustomField,
  skipDefaultValueProcessing,
  sourceData,
  sourceDataPath,
}: ComponentDefaultValuesFnProps<string>): DateComponentProps => {
  let defaultValue;
  let dateFormat = COMPONENT_DEFAULT_VALUES.dateFormat;

  if (!isCustomField) {
    const format = dateFormatOptions.find(({ value: format }) => {
      return moment(sourceData, format, true).isValid();
    });

    if (format) {
      dateFormat = format.value;
    }

    if (sourceDataPath && !skipDefaultValueProcessing) {
      const { endTemplate, startTemplate } = bindingTemplate;
      const defaultValueString = `moment(${sourceDataPath}, "${dateFormat}").format("${ISO_DATE_FORMAT}")`;
      defaultValue = `${startTemplate}${defaultValueString}${endTemplate}`;
    }
  }

  return {
    ...COMPONENT_DEFAULT_VALUES,
    defaultValue,
    dateFormat,
  };
};

type DateFieldProps = BaseFieldComponentProps<DateComponentProps>;

export const isValidType = (value: string) =>
  dateFormatOptions.some(({ value: format }) =>
    moment(value, format, true).isValid(),
  );

const isValid = (schemaItem: DateFieldProps["schemaItem"], value?: string) =>
  schemaItem.isRequired ? Boolean(value?.trim()) : true;

function DateField({ name, schemaItem, ...rest }: DateFieldProps) {
  const {
    fieldType,
    onBlur: onBlurDynamicString,
    onFocus: onFocusDynamicString,
  } = schemaItem;
  const { executeAction } = useContext(FormContext);
  const { inputRef, registerFieldOnBlurHandler } = useEvents<HTMLInputElement>({
    onFocusDynamicString,
    onBlurDynamicString,
  });
  const convertToISORef = useRef<boolean>();

  const { onFieldValidityChange } = useRegisterFieldValidity({
    fieldName: name,
    fieldType,
  });

  const labelStyles = pick(schemaItem, [
    "labelStyle",
    "labelTextColor",
    "labelTextSize",
  ]);

  return (
    <Field
      {...rest}
      defaultValue={schemaItem.defaultValue}
      isRequiredField={schemaItem.isRequired}
      label={schemaItem.label}
      labelStyles={labelStyles}
      name={name}
      render={({ field: { onBlur, onChange, value } }) => {
        const onDateSelected = (selectedValue: string) => {
          if (schemaItem.convertToISO) {
            onChange(selectedValue);
          } else {
            onChange(moment(selectedValue).format(schemaItem.dateFormat));
          }

          if (schemaItem.onDateSelected && executeAction) {
            executeAction({
              triggerPropertyName: "onDateSelected",
              dynamicString: schemaItem.onDateSelected,
              event: {
                type: EventType.ON_DATE_SELECTED,
              },
            });
          }
        };

        const isValueValid = isValid(schemaItem, value);

        const valueInISOFormat = (() => {
          if (!isValueValid) return value;

          if (moment(value, ISO_DATE_FORMAT, true).isValid()) {
            return value;
          }

          const valueInSelectedFormat = moment(
            value,
            schemaItem.dateFormat,
            true,
          );

          if (valueInSelectedFormat.isValid()) {
            return valueInSelectedFormat.format(ISO_DATE_FORMAT);
          }

          return value;
        })();

        if (
          valueInISOFormat &&
          convertToISORef.current !== schemaItem.convertToISO
        ) {
          convertToISORef.current = schemaItem.convertToISO;
          onDateSelected(valueInISOFormat);
        }

        registerFieldOnBlurHandler(onBlur);
        onFieldValidityChange(isValueValid);

        return (
          <DateComponent
            closeOnSelection={schemaItem.closeOnSelection}
            dateFormat={schemaItem.dateFormat}
            datePickerType="DATE_PICKER"
            inputRef={inputRef}
            isDisabled={schemaItem.isDisabled}
            isLoading={false}
            label=""
            maxDate={schemaItem.maxDate}
            minDate={schemaItem.minDate}
            onDateSelected={onDateSelected}
            selectedDate={valueInISOFormat}
            shortcuts={schemaItem.shortcuts}
            timePrecision={schemaItem.timePrecision}
            widgetId=""
          />
        );
      }}
    />
  );
}

DateField.componentDefaultValues = componentDefaultValues;
DateField.isValidType = isValidType;

export default DateField;
