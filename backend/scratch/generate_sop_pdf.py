import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT

def generate_sop_pdf():
    output_path = r"c:\Users\ayush\Desktop\SMART EXPENSE TRACKER\Ayush_Raj_SOP_Amazon_MLSS_2026.pdf"
    
    # Human-sounding 400-word text
    p1 = """
    My interest in Artificial Intelligence and Machine Learning comes from a desire to build applications that solve practical, everyday problems. To gain hands-on experience, I built <b>Smart Expense Tracker</b>, a full-stack Progressive Web App (PWA) using React, FastAPI, and PostgreSQL. I wanted to see how machine learning could make managing personal finance easier and more automated.
    """
    
    p2 = """
    During this project, I worked with several key ML areas. First, I integrated Large Language Models (LLMs) via <b>Gemini and Groq APIs</b> to create a conversational assistant. I wrote custom system prompts to parse unstructured user chat messages into structured JSON schemas that match our PostgreSQL database models. Second, I set up a <b>Computer Vision (OCR)</b> pipeline to automatically extract transaction details from uploaded receipt photos. Third, I implemented a statistical <b>Z-Score anomaly detection algorithm</b> to flag unusual transactions. If a user’s new transaction was more than 2.0 standard deviations away from their average spending, the app triggered a budget alert. While building this was a great learning experience, it made me realize the limits of using pre-built APIs. I had very little control over model accuracy, latency, and data privacy.
    """
    
    p3 = """
    This project helped me identify the gaps in my current machine learning knowledge. I want to move beyond calling black-box APIs and learn how to train and fine-tune custom models myself. In computer vision, instead of using generic OCR endpoints, I want to learn to build and optimize custom Convolutional Neural Networks (CNNs) and Vision Transformers (ViTs) to handle noisy, low-quality receipt images. On the data side, simple statistical Z-scores assume data is normally distributed, which isn't always true for real spending habits. I want to learn advanced unsupervised techniques like Isolation Forests or autoencoders to build better anomaly detectors. Finally, I need to learn how to manage large-scale datasets and deploy low-latency models on cloud platforms like AWS.
    """
    
    p4 = """
    The Amazon ML Summer School (MLSS) 2026 is exactly what I need to bridge these gaps. Learning directly from Amazon's ML scientists about deep learning, vision, and NLP matches my goal of transitioning from a full-stack developer to a machine learning engineer. With a strong academic background (CGPA: 8.93) and practical development experience, I am ready to take this next step. I am confident this program will give me the mathematical foundation and engineering skills to build next-generation AI systems.
    """
    
    # Calculate exact word count
    full_text = " ".join([p1, p2, p3, p4])
    words = [w for w in full_text.split() if w.strip()]
    word_count = len(words)
    print(f"[*] Human SOP word count: {word_count} words.")
    
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
        fontSize=10.5, # Slightly larger body text as it's shorter
        leading=15,
        textColor=colors.HexColor('#333333'),
        alignment=TA_JUSTIFY,
        spaceAfter=12
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
