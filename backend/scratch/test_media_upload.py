import httpx
import asyncio
import os

async def test_media_upload():
    base_url = "http://localhost:8000/api"
    
    # 1. Login to get token (assuming admin@looplab.io exists)
    async with httpx.AsyncClient() as client:
        login_res = await client.post(f"{base_url}/auth/login", data={
            "username": "admin@looplab.io",
            "password": "AdminPassword123!"
        })
        if login_res.status_code != 200:
            print("Login failed, ensure admin user exists.")
            return
        
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Create a dummy job post
        job_data = {
            "title": "Test Job for Media",
            "category": "Software Engineering",
            "description": "Testing media upload",
            "status": "Draft"
        }
        create_res = await client.post(f"{base_url}/job-posts/", json=job_data, headers=headers)
        if create_res.status_code != 200:
            print(f"Job creation failed: {create_res.text}")
            return
        
        job_id = create_res.json()["id"]
        print(f"Created Job ID: {job_id}")
        
        # 3. Upload a dummy media file
        with open("test_media.txt", "w") as f:
            f.write("This is a test media file")
            
        with open("test_media.txt", "rb") as f:
            files = {"file": ("test_media.png", f, "image/png")}
            upload_res = await client.post(f"{base_url}/job-posts/{job_id}/media", files=files, headers=headers)
            
        if upload_res.status_code == 200:
            print("Media upload successful!")
            print(f"Media URL: {upload_res.json()['media_url']}")
        else:
            print(f"Media upload failed: {upload_res.status_code} - {upload_res.text}")
            
        # Cleanup
        os.remove("test_media.txt")

if __name__ == "__main__":
    asyncio.run(test_media_upload())
