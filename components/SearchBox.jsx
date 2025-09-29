import React, { useContext } from 'react';
import { Box, Text } from 'ink';
import { ThemeContext } from '../index.jsx';

const SearchBox = ({ searchQuery }) => {
  const { colors } = useContext(ThemeContext);

  return (
    <Box marginBottom={1} backgroundColor={colors.accent} paddingX={1}>
      <Text color={colors.foreground} bold>Search: /{searchQuery}</Text>
      <Text color={colors.dim} dimColor> • Press Enter to confirm or Escape to clear</Text>
    </Box>
  );
};

export default SearchBox;