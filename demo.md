# Demo Guide

## Quick Start

1. **Start the application**:
   ```bash
   npm run dev
   ```
   The app will open at `http://localhost:3000`

2. **Try importing the sample OpenAPI file**:
   - Click "Import JSON" in the toolbar
   - Select `context/openapi-sample.json`
   - Watch as the schema is parsed and visualized!

3. **Try importing the sample diagram**:
   - Click "Import JSON" again
   - Select `sample-diagram.json`
   - See a pre-built e-commerce schema example

## Features to Test

### 🎨 Canvas Interaction
- **Drag entities** around the canvas
- **Connect entities** by dragging from one to another
- **Zoom and pan** using mouse wheel and drag
- **Use the mini-map** to navigate large diagrams

### ✏️ Editing
- **Click on any entity** to open the properties panel
- **Edit entity names, descriptions, and colors**
- **Add/remove properties** from entities
- **Change property types** (string, number, boolean, array, object, reference)
- **Mark properties as required**

### 💾 Persistence
- **Auto-save**: Changes are automatically saved to localStorage
- **Export**: Save your diagram as a JSON file
- **Import**: Load previously saved diagrams or OpenAPI schemas

### 🎯 Visual Features
- **Color-coded entities** with different colors for each
- **Relationship types**: Different wire styles for references, composition, etc.
- **Property badges**: Color-coded type indicators
- **Responsive design**: Works on different screen sizes

## Sample Data

The `context/openapi-sample.json` file contains a real Adobe Events Service API with:
- 50+ entities
- Complex relationships
- Nested objects and arrays
- Various data types

The `sample-diagram.json` file contains a simpler e-commerce schema with:
- User management
- Order processing
- Profile information
- Clear relationships

## Tips

1. **Start simple**: Import the sample diagram first to understand the interface
2. **Use the properties panel**: Click entities to edit them in detail
3. **Connect relationships**: Drag between entities to show how they relate
4. **Save your work**: Use the export feature to backup your diagrams
5. **Explore the OpenAPI sample**: Import the large schema to see the parser in action

## Troubleshooting

- **Import not working?** Make sure your JSON file is valid
- **Entities not showing?** Check the browser console for errors
- **Can't connect entities?** Make sure you're dragging from the edge of one entity to another
- **Properties panel not opening?** Click directly on the entity, not just near it
