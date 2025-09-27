import React from 'react';
import { Box, Text } from 'ink';
import Story from './Story.jsx';

const StoryList = ({
  stories,
  selectedIndex,
  scrollOffset,
  storiesPerPage = 15
}) => {
  return (
    <>
      {stories.slice(scrollOffset, scrollOffset + storiesPerPage).map((story, index) => {
        const actualIndex = scrollOffset + index;
        const isSelected = actualIndex === selectedIndex;

        return (
          <Story
            key={story.id}
            story={story}
            index={actualIndex}
            isSelected={isSelected}
          />
        );
      })}

      <Box marginTop={1}>
        <Text dimColor>
          Showing {Math.min(storiesPerPage, stories.length - scrollOffset)} of {stories.length} stories • Selected: {selectedIndex + 1}
        </Text>
      </Box>
    </>
  );
};

export default StoryList;