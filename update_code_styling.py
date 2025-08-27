#!/usr/bin/env python3
import os
import glob
import re

def update_code_block_styling(file_path):
    """Update code block styling to GitHub Dark theme for all developer docs"""
    print(f"Updating code block styling in {file_path}...")
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Add Fira Code font import if not already present
    if 'Fira+Code' not in content:
        content = content.replace(
            'family=Titillium+Web:wght@300;400;600;700&display=swap" rel="stylesheet">',
            'family=Titillium+Web:wght@300;400;600;700&display=swap" rel="stylesheet">\n    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap" rel="stylesheet">'
        )
    
    # Remove any existing syntax highlighting JS
    content = re.sub(r'<script>.*?highlightSyntax.*?</script>', '', content, flags=re.DOTALL)
    
    # Update .code-block CSS with new GitHub Dark theme
    old_css_pattern = r'\.code-block \{[^}]*?\}'
    new_css = '''        .code-block {
            background: #0d1117;
            color: #e6edf3;
            padding: 1.5rem;
            border-radius: 8px;
            margin: 1rem 0;
            font-family: 'Fira Code', 'JetBrains Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
            overflow-x: auto;
            border: 1px solid #30363d;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            position: relative;
        }
        
        .code-block::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #58a6ff 0%, #7c3aed 50%, #f85149 100%);
            border-radius: 8px 8px 0 0;
        }
        
        .code-block pre {
            margin: 0;
            padding: 0;
            background: transparent;
            font-size: 0.9rem;
            line-height: 1.6;
        }
        
        .code-block code {
            background: transparent;
            color: inherit;
            padding: 0;
            font-weight: 400;
            font-size: inherit;
            line-height: inherit;
        }'''
    
    # Find and replace the .code-block CSS
    if re.search(old_css_pattern, content, re.DOTALL):
        content = re.sub(old_css_pattern, new_css, content, flags=re.DOTALL)
    
    # Remove any orphaned syntax highlighting CSS classes
    syntax_classes = ['.keyword', '.string', '.comment', '.number', '.function', '.variable', '.type', '.operator', '.punctuation']
    for css_class in syntax_classes:
        pattern = r'\.code-block ' + re.escape(css_class) + r' \{[^}]*?\}'
        content = re.sub(pattern, '', content, flags=re.DOTALL)
    
    # Clean up any remaining JavaScript comments
    content = content.replace('    <!-- No JavaScript needed for now -->', '')
    
    # Write back
    with open(file_path, 'w') as f:
        f.write(content)
    
    print(f"Updated {file_path} with GitHub Dark theme styling")

if __name__ == "__main__":
    # Update all HTML files in the developer docs (excluding backups)
    developer_files = [f for f in glob.glob('public/developer/*.html') if 'backup' not in f]
    
    for file_path in developer_files:
        update_code_block_styling(file_path)
    
    print(f"Applied GitHub Dark theme to {len(developer_files)} developer documentation files")
