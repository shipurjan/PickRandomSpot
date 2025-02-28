// src/lib/theme.ts
export const theme = {
  colors: {
    primary: "#3b82f6", // Blue-500
    secondary: "#1e40af", // Blue-800
    accent: "#3030ff",
    background: {
      dark: "#1a1a1a",
      light: "#f8f8f8",
    },
    text: {
      dark: "#f8f8f8",
      light: "#1a1a1a",
    },
  },
  shapes: {
    circle: {
      color: "#3b82f6",
      fillColor: "#3b82f680",
      highlightColor: "#4287f5",
    },
    ellipse: {
      color: "#10b981",
      fillColor: "#10b98180",
      highlightColor: "#0ea271",
    },
    rectangle: {
      color: "#f59e0b",
      fillColor: "#f59e0b80",
      highlightColor: "#d97706",
    },
    polygon: {
      color: "#8b5cf6",
      fillColor: "#8b5cf680",
      highlightColor: "#7c3aed",
    },
  },
};

export const getShapeStyle = (shapeType: keyof typeof theme.shapes) => {
  return {
    color: theme.shapes[shapeType].color,
    fillColor: theme.shapes[shapeType].fillColor,
    fillOpacity: 0.3,
  };
};
