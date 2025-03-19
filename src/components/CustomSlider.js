import React from "react";
import { Slider as RNESlider } from "react-native-elements";

/**
 * CustomSlider - A wrapper around react-native-elements Slider that uses
 * JavaScript default parameters instead of defaultProps
 *
 * This component fixes the "Support for defaultProps will be removed from function components"
 * warning by replacing defaultProps with ES6 default parameters.
 */
const CustomSlider = ({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 1,
  step = 0,
  disabled = false,
  maximumTrackTintColor = "#b3b3b3",
  minimumTrackTintColor = "#3f3f3f",
  thumbTintColor = "#343434",
  trackStyle = {},
  thumbStyle = {},
  ...otherProps
}) => {
  return (
    <RNESlider
      value={value}
      onValueChange={onValueChange}
      minimumValue={minimumValue}
      maximumValue={maximumValue}
      step={step}
      disabled={disabled}
      maximumTrackTintColor={maximumTrackTintColor}
      minimumTrackTintColor={minimumTrackTintColor}
      thumbTintColor={thumbTintColor}
      trackStyle={trackStyle}
      thumbStyle={thumbStyle}
      {...otherProps}
    />
  );
};

export default CustomSlider;
