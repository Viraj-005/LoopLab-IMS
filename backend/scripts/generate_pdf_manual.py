import os
import sys

try:
    from fpdf import FPDF
    from fpdf.enums import XPos, YPos
except ImportError:
    print("ERROR: 'fpdf2' is required to run this script.")
    print("Please run: pip install fpdf2")
    sys.exit(1)

class ManualPDF(FPDF):
    def header(self):
        self.set_font('Helvetica', 'B', 10)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, 'LOOPLAB IMS | Institutional Documentation', border=0, align='R', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Page {self.page_no()}', border=0, align='C', new_x=XPos.RIGHT, new_y=YPos.TOP)

def generate_manual_pdf(input_md, output_pdf):
    if not os.path.exists(input_md):
        print(f"ERROR: Source file {input_md} not found.")
        return

    pdf = ManualPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    
    # Title Page
    pdf.set_font('Helvetica', 'B', 24)
    pdf.set_text_color(97, 51, 128) # Official LoopLab Purple
    pdf.ln(40)
    pdf.cell(0, 20, 'Intern Management System', border=0, align='C', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font('Helvetica', '', 16)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 10, 'Master Technical Specification v3.0', border=0, align='C', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.ln(100)
    pdf.set_font('Helvetica', 'I', 10)
    pdf.cell(0, 10, 'Directed by Antigravity Protocol', border=0, align='C', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.add_page()

    # Content
    pdf.set_text_color(0, 0, 0)
    with open(input_md, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                pdf.ln(5)
                continue
                
            if line.startswith('# '):
                pdf.set_font('Helvetica', 'B', 18)
                pdf.set_text_color(97, 51, 128)
                pdf.ln(10)
                pdf.cell(0, 10, line[2:], border=0, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.set_text_color(0, 0, 0)
            elif line.startswith('## '):
                pdf.set_font('Helvetica', 'B', 14)
                pdf.ln(5)
                pdf.cell(0, 10, line[3:], border=0, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            elif line.startswith('### '):
                pdf.set_font('Helvetica', 'B', 12)
                pdf.cell(0, 8, line[4:], border=0, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            elif line.startswith('- '):
                pdf.set_font('Helvetica', '', 11)
                # Indent and reset X after multi_cell
                pdf.set_x(20) 
                pdf.multi_cell(0, 6, f"\x95 {line[2:]}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            else:
                pdf.set_font('Helvetica', '', 11)
                pdf.multi_cell(0, 6, line, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.output(output_pdf)
    print(f"SUCCESS: System Manual generated at {output_pdf}")

if __name__ == "__main__":
    generate_manual_pdf('../System_Master_Manual.md', '../System_Master_Manual.pdf')
