Enhanced TreeView Component
A powerful, feature-rich TreeView component built with JavaScript. This component provides a comprehensive solution for displaying hierarchical data with advanced features like pagination, search, export functionality, and more.

🌟 Features
* 📱 Responsive Design - Works seamlessly across all device sizes

* 🔍 Advanced Search - Real-time search with auto-expand of results

* 📄 Pagination - Efficient handling of large datasets

* ✅ Multi-Selection - Checkbox support with parent-child relationships

* 🎨 Theme Support - Light and dark theme options

* 📤 Export/Import - JSON and CSV export capabilities

* 🔧 CRUD Operations - Add, update, remove nodes dynamically

* 🎯 Event Callbacks - Comprehensive event handling

* 💾 Data Management - Internal ID system for reliable operations

* 🎪 Animations - Smooth transitions and hover effects

🚀 Quick Start
Basic Setup

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TreeView Example</title>
    <script src="index.js"></script>
</head>
<body>
    <div id="treeContainer"></div>
    
    <script>
        const treeData = [
            {
                id: 'root-1',
                name: 'Root Node',
                children: [
                    { id: 'child-1', name: 'Child 1' },
                    { id: 'child-2', name: 'Child 2' }
                ]
            }
        ];

        const tree = new TreeView({
            container: document.getElementById('treeContainer'),
            data: treeData,
            displayField: 'name',
            showCheckboxes: true,
            showPagination: true
        });
    </script>
</body>
</html>

📄 License
This project is open source and available under the MIT License.