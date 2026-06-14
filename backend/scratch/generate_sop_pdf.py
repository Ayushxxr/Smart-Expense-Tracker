import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT

def generate_sop_pdf():
    output_path = r"c:\Users\ayush\Desktop\SMART EXPENSE TRACKER\Ayush_Raj_SOP_Amazon_MLSS_2026.pdf"
    
    # The expanded text (490 words)
    p1 = """
    My journey in Artificial Intelligence and Machine Learning is driven by a deep curiosity to build intelligent, scalable applications that solve real-world problems. To translate theoretical machine learning concepts into a practical engineering solution, I developed <b>Smart Expense Tracker</b>, a full-stack Progressive Web App (PWA) built with React, FastAPI, and PostgreSQL. This project served as my personal sandbox to explore how computer vision, NLP, and statistical modeling can simplify everyday personal finance management.
    """
    
    p2 = """
    Throughout this development process, I explored several key domains of AI/ML. First, I leveraged Natural Language Processing (NLP) by integrating <b>Gemini and Groq LLMs</b> to create a conversational assistant. I designed custom system prompts and optimized API calls to reliably convert unstructured user chat logs into structured JSON schemas matching our SQLAlchemy database models. Second, I integrated <b>Computer Vision (OCR)</b> pipelines to parse transaction data from uploaded receipt images, automatically extracting dates, categories, and line-item amounts. This required handling varied image orientations, resolution constraints, and noise during the pre-processing phase to ensure accurate data mapping. Finally, I implemented a statistical <b>Z-Score anomaly detection algorithm</b> to identify outlier transactions. If a user’s new transaction exceeded 2.0 standard deviations of their running average, it immediately flagged the expense. While this application successfully demonstrated the integration of AI features, it highlighted a critical gap: relying on external, pre-trained APIs limits my control over model performance, latency, and data privacy.
    """
    
    p3 = """
    Currently, key gaps remain in my ML knowledge that the Amazon ML Summer School (MLSS) 2026 will help me address. While I can integrate pre-trained APIs, I want to learn the mathematics and architectures behind training, fine-tuning, and deploying custom models from scratch. In computer vision, instead of calling a generic OCR API, I want to learn to build and optimize custom Convolutional Neural Networks (CNNs) and Vision Transformers (ViTs) to handle noisy, low-quality receipt images. In data analysis, simple statistical Z-scores assume a normal distribution; I want to master advanced machine learning anomaly detection techniques like Isolation Forests, autoencoders, and time-series forecasting to predict future monthly budgets. Finally, learning how to handle data imbalance, manage large-scale datasets, and optimize low-latency model inference on cloud platforms like AWS is essential for scaling machine learning applications to millions of active users.
    """
    
    p4 = """
    The Amazon ML Summer School aligns perfectly with my career objective of transitioning from a traditional application developer to a core machine learning engineer who designs proprietary models. The opportunity to learn directly from Amazon’s research scientists about advanced deep learning methodologies, computer vision architectures, and state-of-the-art NLP models is unparalleled. With a strong academic foundation (CGPA: 8.93), hands-on full-stack system development experience, and an insatiable curiosity for mathematical modeling, I am a highly motivated candidate. I am confident that MLSS will equip me with the theoretical depth, engineering practices, and practical tools to build, train, and scale next-generation AI solutions.
    """
    
    # Calculate exact word count
    full_text = " ".join([p1, p2, p3, p4])
    words = [w for w in full_text.split() if w.strip()]
    word_count = len(words)
    print(f"[*] Expanded SOP word count: {word_count} words.")
    
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
        fontSize=10, # Fits 490 words on a single page cleanly
        leading=14,
        textColor=colors.HexColor('#333333'),
        alignment=TA_JUSTIFY,
        spaceAfter=10
    )
    
    story = []
    
    # 1. Document Title
    story.append(Paragraph("STATEMENT OF PURPOSE", title_style))
    story.append(Spacer(1, 5))
    
    # 2. Metadata Block
    meta_text = """
    <b>Applicant Name:</b> Ayush Raj &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>CGPA:</b> 8.93<br/>
    <b>Target Program:</b> Amazon ML Summer School 2026 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>Date:</b> June 14, 2026
    """
    story.append(Paragraph(meta_text, meta_label_style))
    story.append(Spacer(1, 8))
    
    # 3. Horizontal Line
    story.append(HRFlowable(
        width="100%", 
        thickness=1, 
        color=colors.HexColor('#FF9900'), # Amazon Orange
        spaceBefore=3, 
        spaceAfter=12
    ))
    
    # 4. Paragraphs
    story.append(Paragraph(p1, body_style))
    story.append(Paragraph(p2, body_style))
    story.append(Paragraph(p3, body_style))
    story.append(Paragraph(p4, body_style))
    
    # Build document
    doc.build(story)
    print(f"[SUCCESS] PDF generated successfully with {word_count} words!")

if __name__ == "__main__":
    generate_sop_pdf()
