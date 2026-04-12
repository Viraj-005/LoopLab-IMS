import asyncio
import sys
import os

# Add the project root (backend) to the sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.email_service import email_service

async def test_dispatch():
    to_email = "looplab888@gmail.com" # Test sending to self
    subject = "SMTP Protocol Verification"
    body = """
    <html>
        <body>
            <h1 style="color: #613380;">SMTP Handshake Successful</h1>
            <p>This is an automated verification of the <strong>Gmail SMTP</strong> integration for LOOPLAB IMS.</p>
            <p>If you received this, the asynchronous dispatch pipeline is operational.</p>
        </body>
    </html>
    """
    
    print(f"Initiating dispatch to {to_email}...")
    success = await email_service.send_email(to_email, subject, body)
    
    if success:
        print("SUCCESS: Email dispatched successfully via Gmail SMTP.")
    else:
        print("FAILURE: Email dispatch failed. Check SMTP configuration and App Password.")

if __name__ == "__main__":
    asyncio.run(test_dispatch())
