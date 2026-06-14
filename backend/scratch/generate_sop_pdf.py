import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT

def generate_sop_pdf():
    # Output path in the workspace
    output_path = r"c:\Users\ayush\Desktop\SMART EXPENSE TRACKER\Ayush_Raj_SOP_Amazon_MLSS_2026.pdf"
    
    print(f"[*] Generating SOP PDF at: {output_path}")
    
    # Page setup
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=54, # 0.75 in margins
        leftMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        name='SOPTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#232F3E'), # Amazon Dark Navy
        alignment=TA_CENTER,
        spaceAfter=15
    )
    
    meta_label_style = ParagraphStyle(
        name='MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#111111'),
        alignment=TA_LEFT
    )
    
    body_style = ParagraphStyle(
        name='SOPBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=16,
        textColor=colors.HexColor('#333333'),
        alignment=TA_JUSTIFY,
        spaceAfter=14
    )
    
    story = []
    
    # 1. Document Title
    story.append(Paragraph("STATEMENT OF PURPOSE", title_style))
    story.append(Spacer(1, 5))
    
    # 2. Metadata Block (Using a table-like structure via paragraphs and columns)
    meta_text = """
    <b>Applicant Name:</b> Ayush Raj &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>CGPA:</b> 8.93<br/>
    <b>Target Program:</b> Amazon ML Summer School 2026 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Date:</b> June 14, 2026
    """
    story.append(Paragraph(meta_text, meta_label_style))
    story.append(Spacer(1, 10))
    
    # 3. Horizontal Line
    story.append(HRFlowable(
        width="100%", 
        thickness=1, 
        color=colors.HexColor('#FF9900'), # Amazon Orange
        spaceBefore=5, 
        spaceAfter=15
    ))
    
    # 4. SOP Paragraphs
    p1 = """
    My journey in Artificial Intelligence and Machine Learning is driven by a desire to build intelligent applications that solve real-world, everyday challenges. To apply these concepts, I recently developed <b>Smart Expense Tracker</b>, a full-stack Progressive Web App (PWA) built with React, FastAPI, and PostgreSQL.
    """
    story.append(Paragraph(p1, body_style))
    
    p2 = """
    Through this project, I explored several key domains of AI/ML. First, I integrated Large Language Models (LLMs) via <b>Gemini/Groq APIs</b> to create a conversational assistant that interprets natural language text to log expenses and analyze budgets. Second, I integrated <b>Computer Vision (OCR)</b> pipelines to automatically parse transaction data from uploaded receipt images. Finally, I implemented a statistical <b>Z-Score anomaly detection algorithm</b> to identify and alert users about outlier transactions. Building this system gave me hands-on experience in API integration, system design, and database management, but it also highlighted the limitations of relying on pre-built APIs.
    """
    story.append(Paragraph(p2, body_style))
    
    p3 = """
    Currently, key gaps remain in my ML knowledge. While I successfully integrated pre-trained API models, I lack the theoretical depth and practical experience to train, fine-tune, and deploy custom models. For example, instead of relying on external OCR APIs, I want to learn to build and optimize custom vision architectures like Convolutional Neural Networks (CNNs) and Vision Transformers. Additionally, I want to move beyond simple statistical Z-scores—which assume a normal distribution—and master advanced unsupervised ML algorithms like Isolation Forests or Autoencoders for more robust anomaly detection. Finally, learning how to handle large-scale datasets and deploy low-latency ML models on cloud infrastructure like AWS is a major objective.
    """
    story.append(Paragraph(p3, body_style))
    
    p4 = """
    The Amazon ML Summer School (MLSS) 2026 is the perfect opportunity to bridge these gaps. Its rigorous curriculum—covering deep learning, computer vision, and NLP—aligns directly with my goal of transitioning from an application developer to a core machine learning engineer. With a strong academic foundation (CGPA: 8.93), practical full-stack experience, and a deep curiosity for data science, I am eager to learn directly from Amazon’s research scientists. I am confident that MLSS will equip me with the theoretical rigor and engineering skills necessary to build and scale next-generation AI systems.
    """
    story.append(Paragraph(p4, body_style))
    
    # Build document
    doc.build(story)
    print("[SUCCESS] PDF generated successfully!")

if __name__ == "__main__":
    generate_sop_pdf()
