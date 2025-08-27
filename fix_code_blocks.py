#!/usr/bin/env python3
import re
import os
import glob

def fix_code_blocks(file_path):
    """Fix code blocks in HTML file to have proper pre/code tags"""
    print(f"Processing {file_path}...")
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Find all code blocks and fix them
    lines = content.split('\n')
    new_lines = []
    in_code_block = False
    code_content = []
    indent = ""
    
    for i, line in enumerate(lines):
        if '<div class="code-block">' in line:
            in_code_block = True
            indent = line[:line.index('<div')]  # Get indentation
            new_lines.append(line)
            continue
        elif '</div>' in line and in_code_block:
            in_code_block = False
            # Check if code_content already has pre/code tags
            code_text = '\n'.join(code_content)
            if '<pre>' not in code_text and '<code>' not in code_text and code_text.strip():
                # Add proper formatting
                new_lines.append(f"{indent}                        <pre><code>{code_text}</code></pre>")
            else:
                # Already formatted or empty, keep as is
                new_lines.extend(code_content)
            new_lines.append(line)
            code_content = []
            continue
        elif in_code_block:
            code_content.append(line)
            continue
        else:
            new_lines.append(line)
    
    # Write back
    with open(file_path, 'w') as f:
        f.write('\n'.join(new_lines))
    
    print(f"Fixed code blocks in {file_path}")

if __name__ == "__main__":
    # Fix all HTML files in the developer docs
    developer_files = glob.glob('public/developer/*.html')
    
    for file_path in developer_files:
        fix_code_blocks(file_path)
    
    print(f"Fixed code blocks in {len(developer_files)} developer documentation files")
