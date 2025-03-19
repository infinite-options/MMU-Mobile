import React from "react";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import { View } from "react-native";

/**
 * CustomSingleSlider - A single-thumb slider component based on MultiSlider
 *
 * This component provides the same functionality as the CustomSlider but uses
 * MultiSlider internally, which doesn't have defaultProps warnings.
 *
 * @param {boolean} inverted - When true, the colored part of the slider will be to the right of the thumb
 * instead of the left, ideal for minimum value sliders (e.g., minimum height)
 */
const CustomSingleSlider = ({
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
  sliderLength,
  inverted = false,
  ...otherProps
}) => {
  // Convert single value to array for MultiSlider
  const values = [value];

  // Handle value change from MultiSlider (comes as array)
  const handleValuesChange = (values) => {
    if (onValueChange) {
      onValueChange(values[0]);
    }
  };

  // If inverted, swap the colors so the right side is colored
  const selectedStyle = {
    backgroundColor: inverted ? maximumTrackTintColor : minimumTrackTintColor,
    ...trackStyle,
  };

  const unselectedStyle = {
    backgroundColor: inverted ? minimumTrackTintColor : maximumTrackTintColor,
    ...trackStyle,
  };

  return (
    <View>
      <MultiSlider
        values={values}
        onValuesChange={handleValuesChange}
        min={minimumValue}
        max={maximumValue}
        step={step}
        enabledOne={!disabled}
        sliderLength={sliderLength || 280} // Default length if not provided
        selectedStyle={selectedStyle}
        unselectedStyle={unselectedStyle}
        markerStyle={{
          backgroundColor: thumbTintColor,
          ...thumbStyle,
        }}
        trackStyle={trackStyle}
        {...otherProps}
      />
    </View>
  );
};

export default CustomSingleSlider;
