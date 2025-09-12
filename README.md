# NoSQL Diagram Tool

A modern, interactive web application for visualizing and editing NoSQL database schemas. Built with React, TypeScript, and React Flow, this tool allows you to create beautiful diagrams from OpenAPI JSON schemas and edit them with an intuitive drag-and-drop interface.

## Features

- 🎨 **Interactive Canvas**: Drag and drop entities, connect relationships with wires
- 📁 **Import/Export**: Import OpenAPI JSON schemas or export your diagrams
- 💾 **Auto-Save**: Automatically saves your progress to localStorage
- ✏️ **Inline Editing**: Edit entity properties and relationships directly in the UI
- 🎯 **Visual Relationships**: Different wire types for references, composition, aggregation, and inheritance
- 📱 **Responsive Design**: Works on desktop and tablet devices
- 🎨 **Modern UI**: Clean, intuitive interface with Tailwind CSS

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Flow** for interactive diagram canvas
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hot Toast** for notifications
- **React Dropzone** for file uploads

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nosql-diagram-tool
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### Importing Schemas

1. **OpenAPI JSON**: Drag and drop or click "Import JSON" to upload an OpenAPI specification file
2. **Diagram Data**: Import previously exported diagram files

### Creating Diagrams

1. **Add Entities**: Click "Add Entity" to create new schema entities
2. **Edit Properties**: Click on an entity to open the properties panel
3. **Connect Relationships**: Drag from one entity to another to create relationships
4. **Customize**: Change colors, add descriptions, and modify property types

### Exporting

- **Export Diagram**: Save your diagram as a JSON file for later import
- **Save to Browser**: Automatically saved to localStorage (no manual save needed)

## File Structure

```
src/
├── components/          # React components
│   ├── DiagramCanvas.tsx    # Main canvas with React Flow
│   ├── EntityNode.tsx       # Individual entity nodes
│   ├── CustomEdge.tsx       # Relationship wires
│   ├── Toolbar.tsx          # Top toolbar with actions
│   └── PropertiesPanel.tsx  # Right panel for editing
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
│   ├── schemaParser.ts      # OpenAPI schema parsing
│   ├── storage.ts           # localStorage operations
│   └── cn.ts               # CSS class utilities
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

## Supported Schema Formats

### OpenAPI 3.x
- Extracts entities from `components.schemas`
- Parses properties and their types
- Identifies relationships through `$ref` references
- Supports nested objects and arrays

### Custom Diagram Format
```json
{
  "entities": [
    {
      "id": "unique-id",
      "name": "EntityName",
      "type": "object",
      "description": "Entity description",
      "properties": {
        "propertyName": {
          "name": "propertyName",
          "type": "string",
          "description": "Property description",
          "required": true
        }
      },
      "required": ["propertyName"],
      "position": { "x": 100, "y": 100 },
      "color": "#3b82f6"
    }
  ],
  "relationships": [
    {
      "id": "rel-id",
      "source": "source-entity-id",
      "target": "target-entity-id",
      "type": "reference",
      "label": "relationship label"
    }
  ],
  "metadata": {
    "title": "Diagram Title",
    "description": "Diagram description",
    "version": "1.0.0"
  }
}
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features

1. **New Entity Types**: Extend the `Entity` interface in `types/index.ts`
2. **Custom Node Components**: Add new node types to `DiagramCanvas.tsx`
3. **Additional Parsers**: Extend `schemaParser.ts` for new schema formats
4. **UI Components**: Create reusable components in the `components/` directory

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit your changes: `git commit -m 'Add feature'`
5. Push to the branch: `git push origin feature-name`
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [React Flow](https://reactflow.dev/) for the interactive diagram canvas
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Lucide React](https://lucide.dev/) for the beautiful icon set
