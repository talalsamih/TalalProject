#!/usr/bin/env python3
"""
Generate a beautifully styled PDF from the book markdown content
"""

import re
import markdown
from weasyprint import HTML, CSS
from pathlib import Path

def convert_markdown_to_html(md_content):
    """Convert markdown to HTML with extensions"""
    md = markdown.Markdown(extensions=[
        'extra',
        'codehilite',
        'toc',
        'tables',
        'fenced_code'
    ])
    return md.convert(md_content)

def process_book_content(md_file_path):
    """Read and process the book markdown file"""
    with open(md_file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Convert markdown to HTML
    html_content = convert_markdown_to_html(content)

    # Add special styling for Arabic text
    html_content = re.sub(
        r'([\u0600-\u06FF]+)',
        r'<span class="arabic">\1</span>',
        html_content
    )

    # Add key concept boxes for important points
    html_content = re.sub(
        r'<blockquote>(.*?)</blockquote>',
        r'<div class="key-concept">\1</div>',
        html_content,
        flags=re.DOTALL
    )

    return html_content

def create_full_html(book_html_content):
    """Create the complete HTML document with styling"""

    # Read the styled template
    template_path = Path('/home/user/TalalProject/book_styled.html')
    with open(template_path, 'r', encoding='utf-8') as f:
        template = f.read()

    # Insert the book content before the closing </body> tag
    full_html = template.replace('</body>', f'{book_html_content}</body>')

    return full_html

def generate_pdf(output_path='book_final.pdf'):
    """Generate the PDF from HTML"""

    print("📚 Starting PDF generation...")
    print("📖 Reading book content...")

    # Process the book markdown
    book_html = process_book_content('/home/user/TalalProject/book_final.md')

    print("✍️  Converting to styled HTML...")

    # Create full HTML document
    full_html = create_full_html(book_html)

    # Save HTML for debugging
    html_output = Path('/home/user/TalalProject/book_complete.html')
    with open(html_output, 'w', encoding='utf-8') as f:
        f.write(full_html)

    print(f"💾 HTML saved to: {html_output}")
    print("🎨 Generating PDF with professional styling...")

    # Generate PDF
    output_file = Path('/home/user/TalalProject') / output_path
    HTML(string=full_html).write_pdf(
        output_file,
        stylesheets=[CSS(string='''
            @page {
                size: A4;
                margin: 2.5cm 2cm;
            }
        ''')]
    )

    print(f"✅ PDF generated successfully: {output_file}")
    print(f"📄 File size: {output_file.stat().st_size / 1024:.1f} KB")

    return output_file

if __name__ == '__main__':
    try:
        pdf_file = generate_pdf()
        print(f"\n🎉 SUCCESS! Your beautifully styled book is ready:")
        print(f"   {pdf_file}")
    except Exception as e:
        print(f"\n❌ Error generating PDF: {e}")
        import traceback
        traceback.print_exc()
