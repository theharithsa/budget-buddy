#!/usr/bin/env python3
import os
import glob
import re

def add_syntax_highlighting(file_path):
    """Add syntax highlighting CSS and JavaScript to developer documentation files"""
    print(f"Adding syntax highlighting to {file_path}...")
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Add Fira Code font import if not already present
    if 'Fira+Code' not in content:
        content = content.replace(
            'family=Titillium+Web:wght@300;400;600;700&display=swap" rel="stylesheet">',
            'family=Titillium+Web:wght@300;400;600;700&display=swap" rel="stylesheet">\n    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap" rel="stylesheet">'
        )
    
    # Update .code-block CSS if it exists
    old_css_pattern = r'\.code-block \{[^}]*background: #000;[^}]*\}'
    if re.search(old_css_pattern, content, re.DOTALL):
        new_css = '''        .code-block {
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 1.5rem;
            border-radius: 8px;
            margin: 1rem 0;
            font-family: 'Fira Code', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
            overflow-x: auto;
            border: 1px solid #333;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .code-block pre {
            margin: 0;
            padding: 0;
            background: transparent;
        }
        
        .code-block code {
            background: transparent;
            color: inherit;
            padding: 0;
            font-size: 0.9rem;
            line-height: 1.5;
        }

        /* Syntax highlighting for TypeScript/JavaScript */
        .code-block .keyword {
            color: #569cd6; /* Blue for keywords */
            font-weight: bold;
        }
        
        .code-block .string {
            color: #ce9178; /* Orange for strings */
        }
        
        .code-block .comment {
            color: #6a9955; /* Green for comments */
            font-style: italic;
        }
        
        .code-block .number {
            color: #b5cea8; /* Light green for numbers */
        }
        
        .code-block .function {
            color: #dcdcaa; /* Yellow for function names */
        }
        
        .code-block .variable {
            color: #9cdcfe; /* Light blue for variables */
        }
        
        .code-block .type {
            color: #4ec9b0; /* Teal for types */
        }
        
        .code-block .operator {
            color: #d4d4d4; /* White for operators */
        }
        
        .code-block .punctuation {
            color: #cccccc; /* Light gray for punctuation */
        }'''
        
        content = re.sub(old_css_pattern, new_css, content, flags=re.DOTALL)
    
    # Add JavaScript for syntax highlighting if not already present
    if 'highlightSyntax' not in content:
        js_code = '''
    <script>
        // Simple syntax highlighting for TypeScript/JavaScript
        function highlightSyntax() {
            const codeBlocks = document.querySelectorAll('.code-block code');
            
            codeBlocks.forEach(block => {
                let html = block.innerHTML;
                
                // Comments (// and /* */)
                html = html.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
                html = html.replace(/(\/\*[\\s\\S]*?\\*\/)/g, '<span class="comment">$1</span>');
                
                // Strings (single and double quotes, template literals)
                html = html.replace(/([\'"`])((?:(?!\\1)[^\\\\]|\\\\.)*)(\1)/g, '<span class="string">$1$2$3</span>');
                
                // Keywords
                const keywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'try', 'catch', 'throw', 'async', 'await', 'import', 'export', 'from', 'default', 'class', 'extends', 'interface', 'type', 'enum', 'namespace', 'public', 'private', 'protected', 'static', 'readonly', 'abstract'];
                keywords.forEach(keyword => {
                    const regex = new RegExp(`\\\\b(${keyword})\\\\b(?!['\"<])`, 'g');
                    html = html.replace(regex, '<span class="keyword">$1</span>');
                });
                
                // Numbers
                html = html.replace(/\\b(\\d+(?:\\.\\d+)?)\\b/g, '<span class="number">$1</span>');
                
                // Types (capitalized words)
                html = html.replace(/\\b([A-Z][a-zA-Z]*)\\b(?!['\"<])/g, '<span class="type">$1</span>');
                
                // Function calls
                html = html.replace(/\\b([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*(?=\\()/g, '<span class="function">$1</span>');
                
                // Variables (common patterns)
                html = html.replace(/\\b([a-z][a-zA-Z0-9_$]*)\\b(?!['\"<])/g, '<span class="variable">$1</span>');
                
                block.innerHTML = html;
            });
        }
        
        // Run highlighting when page loads
        document.addEventListener('DOMContentLoaded', highlightSyntax);
    </script>'''
        
        content = content.replace('</body>', js_code + '\n</body>')
    
    # Write back
    with open(file_path, 'w') as f:
        f.write(content)
    
    print(f"Updated {file_path} with syntax highlighting")

if __name__ == "__main__":
    # Update all HTML files in the developer docs
    developer_files = [f for f in glob.glob('public/developer/*.html') if 'backup' not in f]
    
    for file_path in developer_files:
        add_syntax_highlighting(file_path)
    
    print(f"Added syntax highlighting to {len(developer_files)} developer documentation files")
