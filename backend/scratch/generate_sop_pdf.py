import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT

def generate_sop_pdf():
    output_path = r"c:\Users\ayush\Desktop\SMART EXPENSE TRACKER\Ayush_Raj_SOP_Amazon_MLSS_2026.pdf"
    
    # Technical yet natural 415-word SOP text
    p1 = """
    My focus in Artificial Intelligence and Machine Learning lies in building production-grade applications that solve practical data problems. To gain hands-on experience, I developed <b>Smart Expense Tracker</b>, a full-stack Progressive Web App (PWA) engineered with <b>React (Vite)</b>, <b>FastAPI (ASGI)</b>, and <b>PostgreSQL (Supabase)</b> to automate personal financial tracking and analyze transaction datasets.
    """
    
    p2 = """
    During this project, I implemented three distinct ML pipelines. First, I integrated Large Language Models (LLMs) via <b>Gemini and Groq APIs</b> to build a conversational assistant. I designed custom <b>system prompts</b> and <b>context constraints</b> to parse unstructured natural language chat inputs into <b>structured JSON schemas</b> matching our SQLAlchemy <b>ORM models</b>. Second, I set up a <b>Computer Vision (OCR) pipeline</b> to segment and extract transaction details from uploaded receipt photos. Third, I implemented a statistical <b>Z-Score anomaly detection algorithm</b> to flag outlier transactions. If a new transaction exceeded a threshold of <b>2.0 standard deviations</b> from the user's running historical average, the app triggered a budget alert. While integrating these APIs was a great exercise, it highlighted the limitations of relying on black-box third-party models, particularly regarding inference latency, data privacy, and the lack of custom fine-tuning capability.
    """
    
    p3 = """
    This project helped me identify key gaps in my current machine learning knowledge. I want to move beyond calling third-party API endpoints and learn to train, evaluate, and deploy <b>custom models</b> myself. In computer vision, instead of generic OCR, I want to study <b>Convolutional Neural Networks (CNNs)</b> and <b>Vision Transformers (ViTs)</b> to build custom segmenting models that handle noisy, low-resolution receipt images. On the data side, simple statistical Z-scores assume a Gaussian distribution, which is rarely true for skewed transactional data. I want to master unsupervised anomaly detection algorithms, such as <b>Isolation Forests</b> and <b>Autoencoders</b>, to identify complex fraudulent patterns. Finally, I need to learn about <b>feature engineering</b>, handling imbalanced datasets, and deploying optimized models on cloud platforms like <b>AWS SageMaker</b>.
    """
    
    p4 = """
    The Amazon ML Summer School (MLSS) 2026 is the perfect opportunity to bridge these gaps. Learning directly from Amazon's ML scientists about <b>deep learning theory, optimization, and NLP</b> matches my career goal of transitioning from a full-stack software developer to a specialized machine learning engineer. With a strong academic record (<b>CGPA: 8.93</b>) and practical deployment experience, I am ready for this academic challenge. I am confident this program will provide the mathematical foundations and engineering principles needed to build next-generation intelligent systems.
    """
    
    # Calculate exact word count
    full_text = " ".join([p1, p2, p3, p4])
    words = [w for w in full_text.split() if w.strip()]
    word_count = len(words)
    print(f"[*] Technical SOP word count: {word_count} words.")
    
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
        fontSize=10.2, # Perfectly sized for 415 words on one page
        leading=14.5,
        textColor=colors.HexColor('#333333'),
        alignment=TA_JUSTIFY,
        spaceAfter=12
    )
    
    story = []
    
    # 1. Document Title
    story.append(Paragraph("STATEMENT OF PURPOSE", title_style))
    story.append(Spacer(1, 5))
    
    # 2. Metadata Block (Using Table for perfect grid alignment)
    meta_data = [
        [Paragraph("<b>Applicant Name:</b> Ayush Raj", meta_label_style), Paragraph("<b>CGPA:</b> 8.93", meta_label_style)],
        [Paragraph("<b>Target Program:</b> Amazon ML Summer School 2026", meta_label_style), Paragraph("<b>Date:</b> June 14, 2026", meta_label_style)]
    ]
    meta_table = Table(meta_data, colWidths=[320, 184])
    meta_table.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    
    story.append(meta_table)
    story.append(Spacer(1, 8))
    
    # 3. Horizontal Line
    story.append(HRFlowable(
        width="100%", 
        thickness=1, 
        color=colors.HexColor('#FF9900'), # Amazon Orange
        spaceBefore=3, 
        spaceAfter=15
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
