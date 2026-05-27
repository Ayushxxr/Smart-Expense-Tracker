import os
import subprocess
import getpass
import time

def find_browser():
    username = getpass.getuser()
    paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        f"C:\\Users\\{username}\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    ]
    
    for p in paths:
        if os.path.exists(p):
            return p
    return None

def main():
    browser_path = find_browser()
    if not browser_path:
        print("[ERROR] Could not locate Google Chrome or Microsoft Edge on standard system paths.")
        return

    print(f"[INFO] Found Chromium engine at: {browser_path}")
    
    html_path = r"C:\Users\ayush\Desktop\SMART EXPENSE TRACKER\full_application_explanation_50pages.html"
    pdf_path = r"C:\Users\ayush\Desktop\SMART EXPENSE TRACKER\Smart Expense Tracker — Full Application Masterclass Manual.pdf"
    
    if not os.path.exists(html_path):
        print(f"[ERROR] Source HTML file not found at: {html_path}")
        return

    # Headless PDF compile command
    cmd = [
        browser_path,
        "--headless=new",
        "--disable-gpu",
        f"--print-to-pdf={pdf_path}",
        "--no-margins",
        "--disable-web-security",
        "--allow-file-access-from-files",
        "--virtual-time-budget=10000",
        "--run-all-compositor-stages-before-draw",
        html_path
    ]
    
    print("[INFO] Initiating headless Chromium engine to print PDF...")
    try:
        # Give a small 2-second sleep to ensure files are fully written
        time.sleep(2)
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=40)
        
        # Verify if the PDF is generated
        if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0:
            print(f"\n[OK] SUCCESS! PDF successfully generated and saved to:")
            print(f"     {pdf_path}")
            print(f"[INFO] Size: {os.path.getsize(pdf_path) / (1024*1024):.2f} MB")
        else:
            print("[ERROR] Browser completed execution, but the PDF file was not created or is empty.")
            print(f"Exit Code: {result.returncode}")
            print(f"Stdout: {result.stdout}")
            print(f"Stderr: {result.stderr}")
    except Exception as e:
        print(f"[ERROR] System failed to execute the Chromium compiler: {str(e)}")

if __name__ == "__main__":
    main()
